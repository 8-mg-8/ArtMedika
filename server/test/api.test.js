const BASE = process.env.API_BASE || 'http://localhost:1488';
const LOGIN = process.env.ADMIN_LOGIN || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || '111';

let token = '';
let passed = 0;
let failed = 0;
const createdIds = { prices: [], services: [], promotions: [], news: [], projects: [], specialists: [] };

function report(name, okFlag, extra = '') {
  if (okFlag) {
    passed += 1;
    console.log(`  ok  - ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  - ${name} ${extra}`);
  }
}

async function call(method, path, { body, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    return { status: 0, payload: { success: false, message: err.message } };
  }

  const payload = raw ? await response.text() : await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

function expect(name, result, { status, check } = {}) {
  const statusOk = status !== undefined ? result.status === status : result.status >= 200 && result.status < 300;
  const checkOk = check ? Boolean(check(result.payload)) : true;
  report(name, statusOk && checkOk, `(status=${result.status}, message=${result.payload?.message ?? ''})`);
  return result;
}

async function cleanup() {
  for (const id of createdIds.specialists) await call('DELETE', `/admin/specialists/${id}`);
  for (const id of createdIds.projects) await call('DELETE', `/admin/projects/${id}`);
  for (const id of createdIds.news) await call('DELETE', `/admin/news/${id}`);
  for (const id of createdIds.promotions) await call('DELETE', `/admin/promotions/${id}`);
  for (const id of createdIds.services) await call('DELETE', `/admin/services/${id}`);
  for (const id of createdIds.prices) await call('DELETE', `/admin/priceYslyga/${id}`);
}

async function testPrices() {
  console.log('\n== Цены на услуги (service_prices) ==');

  let list = await call('GET', '/priceYslyga');
  expect('GET /priceYslyga (публичный)', list, { status: 200, check: (p) => p.success && Array.isArray(p.data) });

  const create = await call('POST', '/admin/priceYslyga', {
    body: {
      service_code: 'T01.001.001',
      mics_code: '9.9.9',
      service_name: 'Тестовая услуга автоматизации',
      category: 'ТЕСТ',
      duration_min: 30,
      price_single: 1000,
      section_name: 'Тестовый раздел',
      section_min_price: 500,
      is_active: 1,
      sort_order: 0,
    },
  });
  expect('POST /admin/priceYslyga', create, { status: 201, check: (p) => p.success && p.data?.id > 0 });
  const priceId = create.payload.data?.id;
  if (priceId) createdIds.prices.push(priceId);

  if (priceId) {
    const patch = await call('PATCH', `/admin/priceYslyga/${priceId}`, {
      body: { price_single: 1500 },
    });
    expect('PATCH /admin/priceYslyga/:id', patch, {
      status: 200,
      check: (p) => p.data?.price_single === 1500,
    });

    const update = await call('PUT', `/admin/priceYslyga/${priceId}`, {
      body: {
        service_name: 'Тестовая услуга обновлена',
        price_single: 2000,
        section_name: 'Тестовый раздел',
        is_active: 1,
        sort_order: 1,
      },
    });
    expect('PUT /admin/priceYslyga/:id', update, { status: 200, check: (p) => p.data?.price_single === 2000 });

    const one = await call('GET', `/priceYslyga/${priceId}`);
    expect('GET /priceYslyga/:id', one, { status: 200, check: (p) => p.data?.id === priceId });

    const remove = await call('DELETE', `/admin/priceYslyga/${priceId}`);
    expect('DELETE /admin/priceYslyga/:id', remove, { status: 200 });
    createdIds.prices = createdIds.prices.filter((id) => id !== priceId);
  }

  const invalid = await call('POST', '/admin/priceYslyga', { body: { service_name: '' } });
  expect('POST /admin/priceYslyga (валидация)', invalid, { status: 400 });
}

async function testServices() {
  console.log('\n== Услуги (services) ==');

  const create = await call('POST', '/admin/services', {
    body: {
      category: 'Тест',
      subcategory: 'Тестовая подкатегория',
      service_name: 'Тестовая услуга',
      description: 'Описание',
      is_active: 1,
      sort_order: 0,
    },
  });
  expect('POST /admin/services', create, { status: 201 });
  const id = create.payload.data?.id;
  if (id) createdIds.services.push(id);

  const list = await call('GET', '/services?search=Тест');
  expect('GET /services?search=', list, { status: 200, check: (p) => p.success });

  if (id) {
    const update = await call('PUT', `/admin/services/${id}`, {
      body: {
        category: 'Тест',
        subcategory: 'Тест',
        service_name: 'Тестовая услуга v2',
        is_active: 1,
        sort_order: 5,
      },
    });
    expect('PUT /admin/services/:id', update, { status: 200, check: (p) => p.data?.service_name === 'Тестовая услуга v2' });

    const remove = await call('DELETE', `/admin/services/${id}`);
    expect('DELETE /admin/services/:id', remove, { status: 200 });
    createdIds.services = createdIds.services.filter((item) => item !== id);
  }
}

async function testPromotions() {
  console.log('\n== Акции (promotions) ==');

  const create = await call('POST', '/admin/promotions', {
    body: {
      title: 'Тестовая акция',
      category: 'Тест',
      description: 'Описание акции',
      discount_percent: 25,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      is_active: 1,
    },
  });
  expect('POST /admin/promotions', create, { status: 201 });
  const id = create.payload.data?.id;
  if (id) createdIds.promotions.push(id);

  const active = await call('GET', '/promotions/active');
  expect('GET /promotions/active', active, { status: 200, check: (p) => Array.isArray(p.data) });

  if (id) {
    const patch = await call('PATCH', `/admin/promotions/${id}`, { body: { discount_percent: 40 } });
    expect('PATCH /admin/promotions/:id', patch, { status: 200, check: (p) => p.data?.discount_percent === 40 });

    const remove = await call('DELETE', `/admin/promotions/${id}`);
    expect('DELETE /admin/promotions/:id', remove, { status: 200 });
    createdIds.promotions = createdIds.promotions.filter((item) => item !== id);
  }
}

async function testNews() {
  console.log('\n== Новости (news) ==');

  const create = await call('POST', '/admin/news', {
    body: {
      title: 'Тестовая новость для проверки',
      subtitle: 'Подзаголовок',
      full_text: 'Полный текст новости',
      category: 'Тест',
      news_date: '2026-10-01',
      is_active: 1,
    },
  });
  expect('POST /admin/news (slug генерируется)', create, {
    status: 201,
    check: (p) => typeof p.data?.slug === 'string' && p.data.slug.length > 0,
  });
  const id = create.payload.data?.id;
  const slug = create.payload.data?.slug;
  if (id) createdIds.news.push(id);

  if (slug) {
    const bySlug = await call('GET', `/news/${slug}`);
    expect('GET /news/:slug (увеличивает views_count)', bySlug, {
      status: 200,
      check: (p) => p.data?.views_count === 1,
    });
  }

  if (id) {
    const remove = await call('DELETE', `/admin/news/${id}`);
    expect('DELETE /admin/news/:id', remove, { status: 200 });
    createdIds.news = createdIds.news.filter((item) => item !== id);
  }
}

async function testProjects() {
  console.log('\n== Проекты (projects + children) ==');

  const create = await call('POST', '/admin/projects', {
    body: {
      title: 'Тестовый проект',
      description: 'Краткое описание',
      project_date: '2026-10-01',
      seasons_count: 1,
      participants_count: 10,
      experts_count: 2,
      winners_count: 1,
      is_active: 1,
    },
  });
  expect('POST /admin/projects', create, { status: 201 });
  const id = create.payload.data?.id;
  const slug = create.payload.data?.slug;
  if (id) createdIds.projects.push(id);

  if (id) {
    const partner = await call('POST', `/admin/projects/${id}/partners`, {
      body: { partner_name: 'Тестовый партнёр', partner_type: 'Общественный' },
    });
    expect('POST /admin/projects/:id/partners', partner, { status: 201 });

    const stage = await call('POST', `/admin/projects/${id}/stages`, {
      body: { stage_number: 1, stage_name: 'Тестовый этап' },
    });
    expect('POST /admin/projects/:id/stages', stage, { status: 201 });

    const gallery = await call('POST', `/admin/projects/${id}/gallery`, {
      body: { photo_path: 'uploads/projects/test.jpg', photo_type: 'event' },
    });
    expect('POST /admin/projects/:id/gallery', gallery, { status: 201 });

    const team = await call('POST', `/admin/projects/${id}/team`, {
      body: { full_name: 'Тест Тестов', role: 'Эксперт', role_category: 'Эксперт' },
    });
    expect('POST /admin/projects/:id/team', team, { status: 201 });

    const partnersList = await call('GET', `/admin/projects/${id}/partners`);
    expect('GET /admin/projects/:id/partners', partnersList, { status: 200, check: (p) => p.count === 1 });

    if (stage.payload.data?.id) {
      const stagePatch = await call('PATCH', `/admin/projectStages/${stage.payload.data.id}`, {
        body: { stage_description: 'Описание этапа' },
      });
      expect('PATCH /admin/projectStages/:id', stagePatch, { status: 200 });

      const stageDelete = await call('DELETE', `/admin/projectStages/${stage.payload.data.id}`);
      expect('DELETE /admin/projectStages/:id', stageDelete, { status: 200 });
    }

    if (slug) {
      const full = await call('GET', `/projects/${slug}`);
      expect('GET /projects/:slug (полная карточка)', full, {
        status: 200,
        check: (p) => Array.isArray(p.data?.partners) && Array.isArray(p.data?.stages),
      });
    }
  }
}

async function testSpecialists() {
  console.log('\n== Специалисты (specialists + children) ==');

  const create = await call('POST', '/admin/specialists', {
    body: {
      last_name: 'Тестов',
      first_name: 'Тест',
      middle_name: 'Тестович',
      full_name: 'Тестов Тест Тестович',
      position: 'Тестовый врач',
      short_description: 'Кратко',
      description: 'Подробно',
      experience_since: 2015,
      operations_count: 10,
      positive_reviews_percent: 99,
      is_active: 1,
      is_featured: 0,
    },
  });
  expect('POST /admin/specialists', create, { status: 201 });
  const id = create.payload.data?.id;
  const slug = create.payload.data?.slug;
  if (id) createdIds.specialists.push(id);

  if (id) {
    const direction = await call('POST', `/admin/specialists/${id}/directions`, {
      body: { direction_name: 'Тестовое направление', direction_category: 'Тест' },
    });
    expect('POST /admin/specialists/:id/directions', direction, { status: 201 });

    const education = await call('POST', `/admin/specialists/${id}/education`, {
      body: {
        education_type: 'Высшее образование',
        organization: 'Тестовый университет',
        year_obtained: 2015,
        qualification: 'Врач',
      },
    });
    expect('POST /admin/specialists/:id/education', education, { status: 201 });

    const cert = await call('POST', `/admin/specialists/${id}/certifications`, {
      body: {
        document_type: 'Сертификат',
        specialty: 'Тест',
        issue_date: '2024-01-01',
        expiry_date: '2027-01-01',
      },
    });
    expect('POST /admin/specialists/:id/certifications', cert, { status: 201 });

    const review = await call('POST', `/admin/specialists/${id}/reviews`, {
      body: { patient_name: 'Пациент', review_text: 'Отличный врач!', rating: 5, review_date: '2026-01-15' },
    });
    expect('POST /admin/specialists/:id/reviews', review, { status: 201 });

    const achievement = await call('POST', `/admin/specialists/${id}/achievements`, {
      body: { achievement_type: 'Публикация', title: 'Тестовая публикация', year: 2024 },
    });
    expect('POST /admin/specialists/:id/achievements', achievement, { status: 201 });

    if (review.payload.data?.id) {
      const reviewDelete = await call('DELETE', `/admin/specialistReviews/${review.payload.data.id}`);
      expect('DELETE /admin/specialistReviews/:id', reviewDelete, { status: 200 });
    }

    if (slug) {
      const full = await call('GET', `/specialists/${slug}`);
      expect('GET /specialists/:slug (полная карточка)', full, {
        status: 200,
        check: (p) => Array.isArray(p.data?.directions) && Array.isArray(p.data?.education),
      });
    }

    const patch = await call('PATCH', `/admin/specialists/${id}`, {
      body: { position: 'Ведущий тестовый врач' },
    });
    expect('PATCH /admin/specialists/:id', patch, { status: 200, check: (p) => p.data?.position === 'Ведущий тестовый врач' });
  }
}

async function testAuth() {
  console.log('\n== Авторизация ==');

  const unauthorized = await call('GET', '/admin/specialists');
  expect('GET /admin/specialists без токена', unauthorized, { status: 401 });

  const badLogin = await call('POST', '/admin/login', { body: { login: LOGIN, password: 'wrong' } });
  expect('POST /admin/login (неверный пароль)', badLogin, { status: 401 });

  const login = await call('POST', '/admin/login', { body: { login: LOGIN, password: PASSWORD } });
  expect('POST /admin/login', login, { status: 200, check: (p) => Boolean(p.data?.token) });
  token = login.payload.data?.token || '';

  const me = await call('GET', '/admin/me');
  expect('GET /admin/me', me, { status: 200 });
}

async function main() {
  console.log(`Тестирование API: ${BASE}`);

  const ping = await call('GET', '/priceYslyga');
  if (ping.status === 0) {
    console.error(`Сервер недоступен (${ping.payload.message}). Запустите: npm start`);
    process.exit(1);
  }

  await testAuth();
  await testPrices();
  await testServices();
  await testPromotions();
  await testNews();
  await testProjects();
  await testSpecialists();

  await cleanup();

  console.log(`\nИтого: ok=${passed}, fail=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Ошибка тестов:', err);
  process.exit(1);
});

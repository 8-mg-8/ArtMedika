const BASE = process.env.API_BASE ?? 'http://localhost:1488';

const TEST_SERVICE = {
  code_nomenclature: 'T01.001.001',
  code_mis: '9.9.9.1',
  service_name: 'Тестовая операция',
  service_type: 'surgery',
  duration_min: 60,
  price_category_i: 1000,
  price_category_ii: 2000,
  price_category_iii: 3000,
};

async function call(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function check(label, condition, extra = '') {
  console.log(`${condition ? '✅' : '❌'} ${label}${extra ? ' — ' + extra : ''}`);
  if (!condition) process.exitCode = 1;
}

const servicePath = (service, prefix = '/admin/priceYslyga') =>
  `${prefix}/${encodeURIComponent(service.code_nomenclature)}/${encodeURIComponent(service.code_mis)}`;

(async () => {
  let r = await call('GET', '/admin/priceYslyga');
  check('список без токена → 401', r.status === 401, `получено ${r.status}`);

  r = await call('POST', '/admin/login', { body: { login: 'admin', password: 'wrong' } });
  check('неверный пароль → 401', r.status === 401, r.json.message);

  r = await call('POST', '/admin/login', { body: { login: 'admin', password: '111' } });
  check('вход → 200 + token в data', r.status === 200 && !!r.json.data?.token, JSON.stringify(r.json));
  const token = r.json.data?.token;

  r = await call('GET', '/admin/me', { token });
  check('проверка токена → 200', r.status === 200, r.json.message);

  r = await call('GET', '/admin/me', { token: 'bad-token' });
  check('битый токен → 401', r.status === 401);

  r = await call('GET', '/admin/priceYslyga', { token });
  check('список с токеном → 200', r.status === 200, `записей: ${r.json.count}`);

  r = await call('GET', '/priceYslyga');
  check('публичный список → 200', r.status === 200, `записей: ${r.json.count}`);
  check(
    'цены приходят числами',
    Array.isArray(r.json.data) &&
      r.json.data.every((row) =>
        ['price_rub', 'price_category_i', 'price_category_ii', 'price_category_iii'].every(
          (field) => row[field] === null || typeof row[field] === 'number',
        ),
      ),
  );

  r = await call('GET', '/priceYslyga?serviceType=consultation', { token });
  check(
    'фильтр по типу консультация → только consultation',
    r.status === 200 && r.json.data.every((row) => row.service_type === 'consultation'),
    `найдено: ${r.json.count}`,
  );

  r = await call('GET', '/priceYslyga?search=маммопластика', { token });
  check('поиск по названию → найдены записи', r.status === 200 && r.json.count > 0, `найдено: ${r.json.count}`);

  r = await call('GET', '/priceYslyga?search=3.2.4.2', { token });
  check('поиск по коду МИС → найдена запись', r.status === 200 && r.json.count === 1, `найдено: ${r.json.count}`);

  r = await call('POST', '/admin/priceYslyga', {
    token,
    body: { service_name: 'Без кодов', service_type: 'consultation', duration_text: 'до 20', price_rub: 100 },
  });
  check('создание без кодов → 400', r.status === 400, r.json.message);

  r = await call('POST', '/admin/priceYslyga', {
    token,
    body: { ...TEST_SERVICE, service_type: 'diagnostic' },
  });
  check('неверный service_type → 400', r.status === 400, r.json.message);

  r = await call('POST', '/admin/priceYslyga', {
    token,
    body: { ...TEST_SERVICE, duration_min: undefined },
  });
  check('операция без длительности → 400', r.status === 400, r.json.message);

  r = await call('POST', '/admin/priceYslyga', { token, body: TEST_SERVICE });
  check('создание операции → 201', r.status === 201, r.json.message);
  check(
    'цены по категориям сохранены числами',
    r.json.data?.price_category_i === 1000 && r.json.data?.price_category_iii === 3000,
    JSON.stringify(r.json.data?.price_category_i),
  );

  r = await call('POST', '/admin/priceYslyga', { token, body: TEST_SERVICE });
  check('дубликат ключа → 409', r.status === 409, r.json.message);

  r = await call('GET', servicePath(TEST_SERVICE, '/priceYslyga'));
  check('чтение по составному ключу → 200', r.status === 200 && r.json.data?.code_mis === TEST_SERVICE.code_mis);

  r = await call('PUT', servicePath(TEST_SERVICE), {
    token,
    body: { ...TEST_SERVICE, service_name: 'Изменённая операция', price_category_i: 5000 },
  });
  check(
    'обновление (PUT) → 200',
    r.status === 200 && r.json.data?.service_name === 'Изменённая операция' && r.json.data?.price_category_i === 5000,
    r.json.message,
  );

  r = await call('PATCH', servicePath(TEST_SERVICE), { token, body: { service_name: 'Частично' } });
  check('обновление (PATCH) → 200', r.status === 200 && r.json.data?.service_name === 'Частично', r.json.message);

  r = await call('PATCH', servicePath(TEST_SERVICE), { token, body: {} });
  check('пустой PATCH → 400', r.status === 400, r.json.message);

  r = await call('PUT', '/admin/priceYslyga/NOPE.1/9.9.9.9', {
    token,
    body: { ...TEST_SERVICE, code_nomenclature: 'NOPE.1', code_mis: '9.9.9.9' },
  });
  check('обновление несуществующей → 404', r.status === 404, r.json.message);

  r = await call('DELETE', servicePath(TEST_SERVICE), { token });
  check('удаление → 200', r.status === 200, r.json.message);

  r = await call('DELETE', servicePath(TEST_SERVICE), { token });
  check('повторное удаление → 404', r.status === 404, r.json.message);

  r = await call('GET', servicePath(TEST_SERVICE, '/priceYslyga'));
  check('удалённая услуга больше не читается → 404', r.status === 404);
})().catch((err) => {
  console.error('❌ Тест не выполнен:', err.message);
  process.exitCode = 1;
});
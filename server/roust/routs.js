const express = require('express');
const router = express.Router();

const Admin = require('../controlers/ControllerAdmin.js');
const Public = require('../controlers/ControllerPublic.js');
const Upload = require('../controlers/ControllerUpload.js');
const {
  PriceSectionsCrud,
  PricesCrud,
  ServicesCrud,
  ServiceCategoriesCrud,
  PromotionsCrud,
  ProjectsCrud,
  ProjectPartners,
  ProjectStages,
  ProjectGallery,
  ProjectTeam,
  NewsCrud,
  SpecialistsCrud,
  SpecialistDirections,
  SpecialistEducation,
  SpecialistCertifications,
  SpecialistPhotos,
  SpecialistReviews,
  SpecialistServices,
  SpecialistAchievements,
} = require('../controlers/CrudControllers.js');
const { requireAdmin } = require('../middleware/auth.js');

// ============================================================
// АВТОРИЗАЦИЯ АДМИНИСТРАТОРА
// ============================================================
router.post('/admin/login', Admin.postAdmin);
router.get('/admin/me', Admin.getAdmin);

// ============================================================
// ПУБЛИЧНЫЕ ЭНДПОИНТЫ
// ============================================================

// Цены на услуги
router.get('/priceSections', PriceSectionsCrud.list);
router.get('/priceYslyga', PricesCrud.list);
router.get('/priceYslyga/:id', PricesCrud.getOne);

// Услуги и категории
router.get('/services', ServicesCrud.list);
router.get('/services/:id', ServicesCrud.getOne);
router.get('/serviceCategories', ServiceCategoriesCrud.list);
router.get('/serviceCategories/tree', Public.getServiceCategoriesTree);

// Акции
router.get('/promotions', PromotionsCrud.list);
router.get('/promotions/active', Public.getActivePromotions);
router.get('/promotions/:id', PromotionsCrud.getOne);

// Проекты
router.get('/projects', ProjectsCrud.list);
router.get('/projects/:slug', Public.getProjectBySlug);
router.get('/projects/:id/detail', ProjectsCrud.getOne);

// Новости
router.get('/news', NewsCrud.list);
router.get('/news/:slug', Public.getNewsBySlug);

// Специалисты
router.get('/specialists', SpecialistsCrud.list);
router.get('/specialists/:slug', Public.getSpecialistBySlug);
router.get('/specialists/:id/detail', SpecialistsCrud.getOne);

// ============================================================
// АДМИН: РАЗДЕЛЫ ПРАЙС-ЛИСТА
// ============================================================
router.get('/admin/priceSections', requireAdmin, PriceSectionsCrud.list);
router.get('/admin/priceSections/:id', requireAdmin, PriceSectionsCrud.getOne);
router.post('/admin/priceSections', requireAdmin, PriceSectionsCrud.create);
router.put('/admin/priceSections/:id', requireAdmin, PriceSectionsCrud.update);
router.patch('/admin/priceSections/:id', requireAdmin, PriceSectionsCrud.patch);
router.delete('/admin/priceSections/:id', requireAdmin, PriceSectionsCrud.remove);

// ============================================================
// АДМИН: ЦЕНЫ НА УСЛУГИ
// ============================================================
router.get('/admin/priceYslyga', requireAdmin, PricesCrud.list);
router.get('/admin/priceYslyga/:id', requireAdmin, PricesCrud.getOne);
router.post('/admin/priceYslyga', requireAdmin, PricesCrud.create);
router.put('/admin/priceYslyga/:id', requireAdmin, PricesCrud.update);
router.patch('/admin/priceYslyga/:id', requireAdmin, PricesCrud.patch);
router.delete('/admin/priceYslyga/:id', requireAdmin, PricesCrud.remove);

// ============================================================
// АДМИН: УСЛУГИ И КАТЕГОРИИ
// ============================================================
router.get('/admin/services', requireAdmin, ServicesCrud.list);
router.get('/admin/services/:id', requireAdmin, ServicesCrud.getOne);
router.post('/admin/services', requireAdmin, ServicesCrud.create);
router.put('/admin/services/:id', requireAdmin, ServicesCrud.update);
router.patch('/admin/services/:id', requireAdmin, ServicesCrud.patch);
router.delete('/admin/services/:id', requireAdmin, ServicesCrud.remove);

router.get('/admin/serviceCategories', requireAdmin, ServiceCategoriesCrud.list);
router.post('/admin/serviceCategories', requireAdmin, ServiceCategoriesCrud.create);
router.put('/admin/serviceCategories/:id', requireAdmin, ServiceCategoriesCrud.update);
router.patch('/admin/serviceCategories/:id', requireAdmin, ServiceCategoriesCrud.patch);
router.delete('/admin/serviceCategories/:id', requireAdmin, ServiceCategoriesCrud.remove);

// ============================================================
// АДМИН: АКЦИИ
// ============================================================
router.get('/admin/promotions', requireAdmin, PromotionsCrud.list);
router.get('/admin/promotions/:id', requireAdmin, PromotionsCrud.getOne);
router.post('/admin/promotions', requireAdmin, PromotionsCrud.create);
router.put('/admin/promotions/:id', requireAdmin, PromotionsCrud.update);
router.patch('/admin/promotions/:id', requireAdmin, PromotionsCrud.patch);
router.delete('/admin/promotions/:id', requireAdmin, PromotionsCrud.remove);

// ============================================================
// АДМИН: ПРОЕКТЫ + вложенные таблицы
// ============================================================
router.get('/admin/projects', requireAdmin, ProjectsCrud.list);
router.get('/admin/projects/:id', requireAdmin, ProjectsCrud.getOne);
router.post('/admin/projects', requireAdmin, ProjectsCrud.create);
router.put('/admin/projects/:id', requireAdmin, ProjectsCrud.update);
router.patch('/admin/projects/:id', requireAdmin, ProjectsCrud.patch);
router.delete('/admin/projects/:id', requireAdmin, ProjectsCrud.remove);

router.get('/admin/projects/:id/partners', requireAdmin, ProjectPartners.list);
router.post('/admin/projects/:id/partners', requireAdmin, ProjectPartners.create);
router.put('/admin/projectPartners/:id', requireAdmin, ProjectPartners.update);
router.patch('/admin/projectPartners/:id', requireAdmin, ProjectPartners.patch);
router.delete('/admin/projectPartners/:id', requireAdmin, ProjectPartners.remove);

router.get('/admin/projects/:id/stages', requireAdmin, ProjectStages.list);
router.post('/admin/projects/:id/stages', requireAdmin, ProjectStages.create);
router.put('/admin/projectStages/:id', requireAdmin, ProjectStages.update);
router.patch('/admin/projectStages/:id', requireAdmin, ProjectStages.patch);
router.delete('/admin/projectStages/:id', requireAdmin, ProjectStages.remove);

router.get('/admin/projects/:id/gallery', requireAdmin, ProjectGallery.list);
router.post('/admin/projects/:id/gallery', requireAdmin, ProjectGallery.create);
router.put('/admin/projectGallery/:id', requireAdmin, ProjectGallery.update);
router.patch('/admin/projectGallery/:id', requireAdmin, ProjectGallery.patch);
router.delete('/admin/projectGallery/:id', requireAdmin, ProjectGallery.remove);

router.get('/admin/projects/:id/team', requireAdmin, ProjectTeam.list);
router.post('/admin/projects/:id/team', requireAdmin, ProjectTeam.create);
router.put('/admin/projectTeam/:id', requireAdmin, ProjectTeam.update);
router.patch('/admin/projectTeam/:id', requireAdmin, ProjectTeam.patch);
router.delete('/admin/projectTeam/:id', requireAdmin, ProjectTeam.remove);

// ============================================================
// АДМИН: НОВОСТИ
// ============================================================
router.get('/admin/news', requireAdmin, NewsCrud.list);
router.get('/admin/news/:id', requireAdmin, NewsCrud.getOne);
router.post('/admin/news', requireAdmin, NewsCrud.create);
router.put('/admin/news/:id', requireAdmin, NewsCrud.update);
router.patch('/admin/news/:id', requireAdmin, NewsCrud.patch);
router.delete('/admin/news/:id', requireAdmin, NewsCrud.remove);

// ============================================================
// АДМИН: СПЕЦИАЛИСТЫ + вложенные таблицы
// ============================================================
router.get('/admin/specialists', requireAdmin, SpecialistsCrud.list);
router.get('/admin/specialists/:id', requireAdmin, SpecialistsCrud.getOne);
router.post('/admin/specialists', requireAdmin, SpecialistsCrud.create);
router.put('/admin/specialists/:id', requireAdmin, SpecialistsCrud.update);
router.patch('/admin/specialists/:id', requireAdmin, SpecialistsCrud.patch);
router.delete('/admin/specialists/:id', requireAdmin, SpecialistsCrud.remove);

router.get('/admin/specialists/:id/directions', requireAdmin, SpecialistDirections.list);
router.post('/admin/specialists/:id/directions', requireAdmin, SpecialistDirections.create);
router.put('/admin/specialistDirections/:id', requireAdmin, SpecialistDirections.update);
router.patch('/admin/specialistDirections/:id', requireAdmin, SpecialistDirections.patch);
router.delete('/admin/specialistDirections/:id', requireAdmin, SpecialistDirections.remove);

router.get('/admin/specialists/:id/education', requireAdmin, SpecialistEducation.list);
router.post('/admin/specialists/:id/education', requireAdmin, SpecialistEducation.create);
router.put('/admin/specialistEducation/:id', requireAdmin, SpecialistEducation.update);
router.patch('/admin/specialistEducation/:id', requireAdmin, SpecialistEducation.patch);
router.delete('/admin/specialistEducation/:id', requireAdmin, SpecialistEducation.remove);

router.get('/admin/specialists/:id/certifications', requireAdmin, SpecialistCertifications.list);
router.post('/admin/specialists/:id/certifications', requireAdmin, SpecialistCertifications.create);
router.put('/admin/specialistCertifications/:id', requireAdmin, SpecialistCertifications.update);
router.patch('/admin/specialistCertifications/:id', requireAdmin, SpecialistCertifications.patch);
router.delete('/admin/specialistCertifications/:id', requireAdmin, SpecialistCertifications.remove);

router.get('/admin/specialists/:id/photos', requireAdmin, SpecialistPhotos.list);
router.post('/admin/specialists/:id/photos', requireAdmin, SpecialistPhotos.create);
router.put('/admin/specialistPhotos/:id', requireAdmin, SpecialistPhotos.update);
router.patch('/admin/specialistPhotos/:id', requireAdmin, SpecialistPhotos.patch);
router.delete('/admin/specialistPhotos/:id', requireAdmin, SpecialistPhotos.remove);

router.get('/admin/specialists/:id/reviews', requireAdmin, SpecialistReviews.list);
router.post('/admin/specialists/:id/reviews', requireAdmin, SpecialistReviews.create);
router.put('/admin/specialistReviews/:id', requireAdmin, SpecialistReviews.update);
router.patch('/admin/specialistReviews/:id', requireAdmin, SpecialistReviews.patch);
router.delete('/admin/specialistReviews/:id', requireAdmin, SpecialistReviews.remove);

router.get('/admin/specialists/:id/services', requireAdmin, SpecialistServices.list);
router.post('/admin/specialists/:id/services', requireAdmin, SpecialistServices.create);
router.put('/admin/specialistServices/:id', requireAdmin, SpecialistServices.update);
router.patch('/admin/specialistServices/:id', requireAdmin, SpecialistServices.patch);
router.delete('/admin/specialistServices/:id', requireAdmin, SpecialistServices.remove);

router.get('/admin/specialists/:id/achievements', requireAdmin, SpecialistAchievements.list);
router.post('/admin/specialists/:id/achievements', requireAdmin, SpecialistAchievements.create);
router.put('/admin/specialistAchievements/:id', requireAdmin, SpecialistAchievements.update);
router.patch('/admin/specialistAchievements/:id', requireAdmin, SpecialistAchievements.patch);
router.delete('/admin/specialistAchievements/:id', requireAdmin, SpecialistAchievements.remove);

// ============================================================
// АДМИН: ЗАГРУЗКА ФАЙЛОВ
// ============================================================
router.post('/admin/upload', requireAdmin, Upload.uploadFile);
router.get('/admin/uploads', requireAdmin, Upload.list);
router.delete('/admin/uploads/:id', requireAdmin, Upload.remove);

module.exports = router;

const express = require('express');
const router = express.Router();

const Admin = require('../controlers/ControllerAdmin.js');
const Public = require('../controlers/ControllerPublic.js');
const Upload = require('../controlers/ControllerUpload.js');
const {
  PriceListsCrud,
  PriceCategoriesCrud,
  ServiceSectionsCrud,
  ServiceSubsectionsCrud,
  ServicesCrud,
  ServiceProblems,
  ServiceTypes,
  ServiceResults,
  ServiceProblemsAdmin,
  ServiceTypesAdmin,
  ServiceResultsAdmin,
  ServiceSpecialists,
  PromotionsCrud,
  ProjectsCrud,
  ProjectDetails,
  ProjectSeasons,
  ProjectParticipants,
  ProjectExperts,
  ProjectPartners,
  ProjectWorkFormats,
  ProjectStages,
  FillProjectPartnersCount,
  ProjectDetailsAdmin,
  ProjectSeasonsAdmin,
  ProjectParticipantsAdmin,
  ProjectExpertsAdmin,
  ProjectPartnersAdmin,
  ProjectWorkFormatsAdmin,
  ProjectStagesAdmin,
  NewsCrud,
  SpecialistsCrud,
  SpecialistExperience,
  SpecialistOperations,
  SpecialistPositiveReviews,
  SpecialistServices,
  SpecialistEducation,
  SpecialistAccreditations,
  SpecialistExperienceAdmin,
  SpecialistOperationsAdmin,
  SpecialistPositiveReviewsAdmin,
  SpecialistEducationAdmin,
  SpecialistServicesAdmin,
  SpecialistAccreditationsAdmin,
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
router.get('/priceYslyga', PriceCategoriesCrud.list);
router.get('/priceYslyga/:id', PriceCategoriesCrud.getOne);

// Услуги (разделы → подразделы → услуги)
router.get('/serviceSections', ServiceSectionsCrud.list);
router.get('/serviceSubsections', ServiceSubsectionsCrud.list);
router.get('/services', ServicesCrud.list);
router.get('/services/tree', Public.getServicesTree);
router.get('/services/:slug', Public.getServiceBySlug);
router.get('/services/:id/detail', Public.getServiceDetail);

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
// АДМИН: ЦЕНЫ НА УСЛУГИ
// ============================================================
router.get('/admin/priceLists', requireAdmin, PriceListsCrud.list);
router.get('/admin/priceLists/:id', requireAdmin, PriceListsCrud.getOne);
router.post('/admin/priceLists', requireAdmin, PriceListsCrud.create);
router.put('/admin/priceLists/:id', requireAdmin, PriceListsCrud.update);
router.patch('/admin/priceLists/:id', requireAdmin, PriceListsCrud.patch);
router.delete('/admin/priceLists/:id', requireAdmin, PriceListsCrud.remove);

router.get('/admin/priceCategories', requireAdmin, PriceCategoriesCrud.list);
router.get('/admin/priceCategories/:id', requireAdmin, PriceCategoriesCrud.getOne);
router.post('/admin/priceCategories', requireAdmin, PriceCategoriesCrud.create);
router.put('/admin/priceCategories/:id', requireAdmin, PriceCategoriesCrud.update);
router.patch('/admin/priceCategories/:id', requireAdmin, PriceCategoriesCrud.patch);
router.delete('/admin/priceCategories/:id', requireAdmin, PriceCategoriesCrud.remove);

// ============================================================
// АДМИН: РАЗДЕЛЫ И ПОДРАЗДЕЛЫ УСЛУГ
// ============================================================
router.get('/admin/serviceSections', requireAdmin, ServiceSectionsCrud.list);
router.get('/admin/serviceSections/:id', requireAdmin, ServiceSectionsCrud.getOne);
router.post('/admin/serviceSections', requireAdmin, ServiceSectionsCrud.create);
router.put('/admin/serviceSections/:id', requireAdmin, ServiceSectionsCrud.update);
router.patch('/admin/serviceSections/:id', requireAdmin, ServiceSectionsCrud.patch);
router.delete('/admin/serviceSections/:id', requireAdmin, ServiceSectionsCrud.remove);

router.get('/admin/serviceSubsections', requireAdmin, ServiceSubsectionsCrud.list);
router.get('/admin/serviceSubsections/:id', requireAdmin, ServiceSubsectionsCrud.getOne);
router.post('/admin/serviceSubsections', requireAdmin, ServiceSubsectionsCrud.create);
router.put('/admin/serviceSubsections/:id', requireAdmin, ServiceSubsectionsCrud.update);
router.patch('/admin/serviceSubsections/:id', requireAdmin, ServiceSubsectionsCrud.patch);
router.delete('/admin/serviceSubsections/:id', requireAdmin, ServiceSubsectionsCrud.remove);

// ============================================================
// АДМИН: УСЛУГИ + вложенные таблицы
// ============================================================
router.get('/admin/services', requireAdmin, ServicesCrud.list);
router.get('/admin/services/:id', requireAdmin, ServicesCrud.getOne);
router.post('/admin/services', requireAdmin, ServicesCrud.create);
router.put('/admin/services/:id', requireAdmin, ServicesCrud.update);
router.patch('/admin/services/:id', requireAdmin, ServicesCrud.patch);
router.delete('/admin/services/:id', requireAdmin, ServicesCrud.remove);

router.get('/admin/services/:id/problems', requireAdmin, ServiceProblems.list);
router.post('/admin/services/:id/problems', requireAdmin, ServiceProblems.create);

router.get('/admin/serviceProblems', requireAdmin, ServiceProblemsAdmin.list);
router.get('/admin/serviceProblems/:id', requireAdmin, ServiceProblemsAdmin.getOne);
router.post('/admin/serviceProblems', requireAdmin, ServiceProblemsAdmin.create);
router.put('/admin/serviceProblems/:id', requireAdmin, ServiceProblemsAdmin.update);
router.patch('/admin/serviceProblems/:id', requireAdmin, ServiceProblemsAdmin.patch);
router.delete('/admin/serviceProblems/:id', requireAdmin, ServiceProblemsAdmin.remove);

router.get('/admin/services/:id/types', requireAdmin, ServiceTypes.list);
router.post('/admin/services/:id/types', requireAdmin, ServiceTypes.create);

router.get('/admin/serviceTypes', requireAdmin, ServiceTypesAdmin.list);
router.get('/admin/serviceTypes/:id', requireAdmin, ServiceTypesAdmin.getOne);
router.post('/admin/serviceTypes', requireAdmin, ServiceTypesAdmin.create);
router.put('/admin/serviceTypes/:id', requireAdmin, ServiceTypesAdmin.update);
router.patch('/admin/serviceTypes/:id', requireAdmin, ServiceTypesAdmin.patch);
router.delete('/admin/serviceTypes/:id', requireAdmin, ServiceTypesAdmin.remove);

router.get('/admin/services/:id/results', requireAdmin, ServiceResults.list);
router.post('/admin/services/:id/results', requireAdmin, ServiceResults.create);

router.get('/admin/serviceResults', requireAdmin, ServiceResultsAdmin.list);
router.get('/admin/serviceResults/:id', requireAdmin, ServiceResultsAdmin.getOne);
router.post('/admin/serviceResults', requireAdmin, ServiceResultsAdmin.create);
router.put('/admin/serviceResults/:id', requireAdmin, ServiceResultsAdmin.update);
router.patch('/admin/serviceResults/:id', requireAdmin, ServiceResultsAdmin.patch);
router.delete('/admin/serviceResults/:id', requireAdmin, ServiceResultsAdmin.remove);

router.get('/admin/services/:id/specialists', requireAdmin, ServiceSpecialists.list);
router.post('/admin/services/:id/specialists', requireAdmin, ServiceSpecialists.create);
router.put('/admin/serviceServices/:id', requireAdmin, ServiceSpecialists.update);
router.patch('/admin/serviceServices/:id', requireAdmin, ServiceSpecialists.patch);
router.delete('/admin/serviceServices/:id', requireAdmin, ServiceSpecialists.remove);

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
router.post('/admin/projects/:id/partners-count', requireAdmin, FillProjectPartnersCount);

router.get('/admin/projects/:id/details', requireAdmin, ProjectDetails.list);
router.post('/admin/projects/:id/details', requireAdmin, ProjectDetails.create);
router.get('/admin/projectDetails', requireAdmin, ProjectDetailsAdmin.list);
router.get('/admin/projectDetails/:id', requireAdmin, ProjectDetailsAdmin.getOne);
router.post('/admin/projectDetails', requireAdmin, ProjectDetailsAdmin.create);
router.put('/admin/projectDetails/:id', requireAdmin, ProjectDetailsAdmin.update);
router.patch('/admin/projectDetails/:id', requireAdmin, ProjectDetailsAdmin.patch);
router.delete('/admin/projectDetails/:id', requireAdmin, ProjectDetailsAdmin.remove);

router.get('/admin/projects/:id/seasons', requireAdmin, ProjectSeasons.list);
router.post('/admin/projects/:id/seasons', requireAdmin, ProjectSeasons.create);
router.get('/admin/projectSeasons', requireAdmin, ProjectSeasonsAdmin.list);
router.get('/admin/projectSeasons/:id', requireAdmin, ProjectSeasonsAdmin.getOne);
router.post('/admin/projectSeasons', requireAdmin, ProjectSeasonsAdmin.create);
router.put('/admin/projectSeasons/:id', requireAdmin, ProjectSeasonsAdmin.update);
router.patch('/admin/projectSeasons/:id', requireAdmin, ProjectSeasonsAdmin.patch);
router.delete('/admin/projectSeasons/:id', requireAdmin, ProjectSeasonsAdmin.remove);

router.get('/admin/projects/:id/participants', requireAdmin, ProjectParticipants.list);
router.post('/admin/projects/:id/participants', requireAdmin, ProjectParticipants.create);
router.get('/admin/projectParticipants', requireAdmin, ProjectParticipantsAdmin.list);
router.get('/admin/projectParticipants/:id', requireAdmin, ProjectParticipantsAdmin.getOne);
router.post('/admin/projectParticipants', requireAdmin, ProjectParticipantsAdmin.create);
router.put('/admin/projectParticipants/:id', requireAdmin, ProjectParticipantsAdmin.update);
router.patch('/admin/projectParticipants/:id', requireAdmin, ProjectParticipantsAdmin.patch);
router.delete('/admin/projectParticipants/:id', requireAdmin, ProjectParticipantsAdmin.remove);

router.get('/admin/projects/:id/experts', requireAdmin, ProjectExperts.list);
router.post('/admin/projects/:id/experts', requireAdmin, ProjectExperts.create);
router.get('/admin/projectExperts', requireAdmin, ProjectExpertsAdmin.list);
router.get('/admin/projectExperts/:id', requireAdmin, ProjectExpertsAdmin.getOne);
router.post('/admin/projectExperts', requireAdmin, ProjectExpertsAdmin.create);
router.put('/admin/projectExperts/:id', requireAdmin, ProjectExpertsAdmin.update);
router.patch('/admin/projectExperts/:id', requireAdmin, ProjectExpertsAdmin.patch);
router.delete('/admin/projectExperts/:id', requireAdmin, ProjectExpertsAdmin.remove);

router.get('/admin/projects/:id/partners', requireAdmin, ProjectPartners.list);
router.post('/admin/projects/:id/partners', requireAdmin, ProjectPartners.create);
router.get('/admin/projectPartners', requireAdmin, ProjectPartnersAdmin.list);
router.get('/admin/projectPartners/:id', requireAdmin, ProjectPartnersAdmin.getOne);
router.post('/admin/projectPartners', requireAdmin, ProjectPartnersAdmin.create);
router.put('/admin/projectPartners/:id', requireAdmin, ProjectPartnersAdmin.update);
router.patch('/admin/projectPartners/:id', requireAdmin, ProjectPartnersAdmin.patch);
router.delete('/admin/projectPartners/:id', requireAdmin, ProjectPartnersAdmin.remove);

router.get('/admin/projects/:id/workFormats', requireAdmin, ProjectWorkFormats.list);
router.post('/admin/projects/:id/workFormats', requireAdmin, ProjectWorkFormats.create);
router.get('/admin/projectWorkFormats', requireAdmin, ProjectWorkFormatsAdmin.list);
router.get('/admin/projectWorkFormats/:id', requireAdmin, ProjectWorkFormatsAdmin.getOne);
router.post('/admin/projectWorkFormats', requireAdmin, ProjectWorkFormatsAdmin.create);
router.put('/admin/projectWorkFormats/:id', requireAdmin, ProjectWorkFormatsAdmin.update);
router.patch('/admin/projectWorkFormats/:id', requireAdmin, ProjectWorkFormatsAdmin.patch);
router.delete('/admin/projectWorkFormats/:id', requireAdmin, ProjectWorkFormatsAdmin.remove);

router.get('/admin/projects/:id/stages', requireAdmin, ProjectStages.list);
router.post('/admin/projects/:id/stages', requireAdmin, ProjectStages.create);
router.get('/admin/projectStages', requireAdmin, ProjectStagesAdmin.list);
router.get('/admin/projectStages/:id', requireAdmin, ProjectStagesAdmin.getOne);
router.post('/admin/projectStages', requireAdmin, ProjectStagesAdmin.create);
router.put('/admin/projectStages/:id', requireAdmin, ProjectStagesAdmin.update);
router.patch('/admin/projectStages/:id', requireAdmin, ProjectStagesAdmin.patch);
router.delete('/admin/projectStages/:id', requireAdmin, ProjectStagesAdmin.remove);

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

router.get('/admin/specialists/:id/experience', requireAdmin, SpecialistExperience.list);
router.post('/admin/specialists/:id/experience', requireAdmin, SpecialistExperience.create);
router.get('/admin/specialistExperience', requireAdmin, SpecialistExperienceAdmin.list);
router.get('/admin/specialistExperience/:id', requireAdmin, SpecialistExperienceAdmin.getOne);
router.post('/admin/specialistExperience', requireAdmin, SpecialistExperienceAdmin.create);
router.put('/admin/specialistExperience/:id', requireAdmin, SpecialistExperienceAdmin.update);
router.patch('/admin/specialistExperience/:id', requireAdmin, SpecialistExperienceAdmin.patch);
router.delete('/admin/specialistExperience/:id', requireAdmin, SpecialistExperienceAdmin.remove);

router.get('/admin/specialists/:id/operations', requireAdmin, SpecialistOperations.list);
router.post('/admin/specialists/:id/operations', requireAdmin, SpecialistOperations.create);
router.get('/admin/specialistOperations', requireAdmin, SpecialistOperationsAdmin.list);
router.get('/admin/specialistOperations/:id', requireAdmin, SpecialistOperationsAdmin.getOne);
router.post('/admin/specialistOperations', requireAdmin, SpecialistOperationsAdmin.create);
router.put('/admin/specialistOperations/:id', requireAdmin, SpecialistOperationsAdmin.update);
router.patch('/admin/specialistOperations/:id', requireAdmin, SpecialistOperationsAdmin.patch);
router.delete('/admin/specialistOperations/:id', requireAdmin, SpecialistOperationsAdmin.remove);

router.get('/admin/specialists/:id/positiveReviews', requireAdmin, SpecialistPositiveReviews.list);
router.post('/admin/specialists/:id/positiveReviews', requireAdmin, SpecialistPositiveReviews.create);
router.get('/admin/specialistPositiveReviews', requireAdmin, SpecialistPositiveReviewsAdmin.list);
router.get('/admin/specialistPositiveReviews/:id', requireAdmin, SpecialistPositiveReviewsAdmin.getOne);
router.post('/admin/specialistPositiveReviews', requireAdmin, SpecialistPositiveReviewsAdmin.create);
router.put('/admin/specialistPositiveReviews/:id', requireAdmin, SpecialistPositiveReviewsAdmin.update);
router.patch('/admin/specialistPositiveReviews/:id', requireAdmin, SpecialistPositiveReviewsAdmin.patch);
router.delete('/admin/specialistPositiveReviews/:id', requireAdmin, SpecialistPositiveReviewsAdmin.remove);

router.get('/admin/specialists/:id/services', requireAdmin, SpecialistServices.list);
router.post('/admin/specialists/:id/services', requireAdmin, SpecialistServices.create);
router.get('/admin/specialistServices', requireAdmin, SpecialistServicesAdmin.list);
router.get('/admin/specialistServices/:id', requireAdmin, SpecialistServicesAdmin.getOne);
router.post('/admin/specialistServices', requireAdmin, SpecialistServicesAdmin.create);
router.put('/admin/specialistServices/:id', requireAdmin, SpecialistServicesAdmin.update);
router.patch('/admin/specialistServices/:id', requireAdmin, SpecialistServicesAdmin.patch);
router.delete('/admin/specialistServices/:id', requireAdmin, SpecialistServicesAdmin.remove);

router.get('/admin/specialists/:id/education', requireAdmin, SpecialistEducation.list);
router.post('/admin/specialists/:id/education', requireAdmin, SpecialistEducation.create);
router.get('/admin/specialistEducation', requireAdmin, SpecialistEducationAdmin.list);
router.get('/admin/specialistEducation/:id', requireAdmin, SpecialistEducationAdmin.getOne);
router.post('/admin/specialistEducation', requireAdmin, SpecialistEducationAdmin.create);
router.put('/admin/specialistEducation/:id', requireAdmin, SpecialistEducationAdmin.update);
router.patch('/admin/specialistEducation/:id', requireAdmin, SpecialistEducationAdmin.patch);
router.delete('/admin/specialistEducation/:id', requireAdmin, SpecialistEducationAdmin.remove);

router.get('/admin/specialists/:id/accreditations', requireAdmin, SpecialistAccreditations.list);
router.post('/admin/specialists/:id/accreditations', requireAdmin, SpecialistAccreditations.create);
router.get('/admin/specialistAccreditations', requireAdmin, SpecialistAccreditationsAdmin.list);
router.get('/admin/specialistAccreditations/:id', requireAdmin, SpecialistAccreditationsAdmin.getOne);
router.post('/admin/specialistAccreditations', requireAdmin, SpecialistAccreditationsAdmin.create);
router.put('/admin/specialistAccreditations/:id', requireAdmin, SpecialistAccreditationsAdmin.update);
router.patch('/admin/specialistAccreditations/:id', requireAdmin, SpecialistAccreditationsAdmin.patch);
router.delete('/admin/specialistAccreditations/:id', requireAdmin, SpecialistAccreditationsAdmin.remove);

// ============================================================
// АДМИН: ЗАГРУЗКА ФАЙЛОВ
// ============================================================
router.post('/admin/upload', requireAdmin, Upload.uploadFile);
router.get('/admin/uploads', requireAdmin, Upload.list);
router.delete('/admin/uploads/:id', requireAdmin, Upload.remove);

module.exports = router;

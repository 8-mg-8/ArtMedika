const express = require('express');
const router = express.Router();
const Admin = require('../controlers/ControllerAdmin.js');
const PostgreSQL = require('../controlers/ControllePostgre.js');
const { requireAdmin } = require('../middleware/auth.js');

router.post('/admin/login', Admin.postAdmin);
router.get('/admin/me', Admin.getAdmin);

router.get('/priceYslyga', PostgreSQL.getPriceYslyga);
router.get('/priceYslyga/:codeNomenclature/:codeMis', PostgreSQL.getOnePriceYslyga);

router.get('/admin/priceYslyga', requireAdmin, PostgreSQL.getPriceYslyga);
router.post('/admin/priceYslyga', requireAdmin, PostgreSQL.addPriceYslyga);
router.put('/admin/priceYslyga/:codeNomenclature/:codeMis', requireAdmin, PostgreSQL.updatePriceYslyga);
router.patch('/admin/priceYslyga/:codeNomenclature/:codeMis', requireAdmin, PostgreSQL.patchPriceYslyga);
router.delete(
  '/admin/priceYslyga/:codeNomenclature/:codeMis',
  requireAdmin,
  PostgreSQL.deletePriceYslyga,
);

module.exports = router;
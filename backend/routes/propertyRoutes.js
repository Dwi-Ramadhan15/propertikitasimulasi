const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { uploadMultiple } = require('../middlewares/uploadMiddleware');

router.get('/admin', verifyToken, checkRole(['super_admin']), propertyController.getAllPropertiesAdmin);
router.put('/:id/status', verifyToken, checkRole(['super_admin']), propertyController.updatePropertyStatus);
router.get('/agent', verifyToken, checkRole(['agen']), propertyController.getAgentProperties);
router.post('/', verifyToken, checkRole(['agen']), uploadMultiple, propertyController.createProperty);
router.get('/', propertyController.getPublicProperties);

router.get('/slug/:slug', propertyController.getPropertyBySlug);

router.get('/:id', propertyController.getPropertyById);

module.exports = router;
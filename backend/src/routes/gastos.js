const express = require('express');
const router = express.Router();
const gastoController = require('../controllers/gastoController');
const upload = require('../middleware/upload');

router.get('/', gastoController.getAll);
router.get('/resumen-trimestral', gastoController.getResumenTrimestral);
router.get('/:id', gastoController.getById);
router.post('/', upload.single('archivo'), gastoController.create);
router.put('/:id', upload.single('archivo'), gastoController.update);
router.delete('/:id', gastoController.delete);

module.exports = router;

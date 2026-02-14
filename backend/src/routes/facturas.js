const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');

router.get('/next-number', facturaController.getNextNumber);
router.get('/email-log', facturaController.getEmailLog);
router.get('/', facturaController.getAll);
router.get('/:id', facturaController.getById);
router.post('/', facturaController.create);
router.put('/:id', facturaController.update);
router.delete('/:id', facturaController.delete);

// PDF & Email
router.get('/:id/pdf', facturaController.generatePDF);
router.post('/:id/enviar', facturaController.sendEmail);

module.exports = router;

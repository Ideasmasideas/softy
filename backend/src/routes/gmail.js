const express = require('express');
const router = express.Router();
const gmailController = require('../controllers/gmailController');

router.get('/status', gmailController.status);
router.get('/auth', gmailController.auth);
router.get('/callback', gmailController.callback);
router.get('/emails', gmailController.emails);
router.get('/emails/:id', gmailController.emailDetail);
router.post('/emails/:id/procesar', gmailController.procesar);
router.post('/emails/:id/crear-tareas', gmailController.crearTareas);
router.delete('/disconnect', gmailController.disconnect);

module.exports = router;

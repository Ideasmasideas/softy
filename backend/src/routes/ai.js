const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const upload = require('../middleware/upload');

router.get('/briefing', aiController.briefing);
router.post('/generate-tasks', aiController.generateTasks);
router.post('/extract-invoice', upload.single('archivo'), aiController.extractInvoice);
router.post('/chat', aiController.chat);

module.exports = router;

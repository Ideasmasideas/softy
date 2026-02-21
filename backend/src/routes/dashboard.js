const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/', dashboardController.getStats);
router.get('/fiscal', dashboardController.getFiscal);

module.exports = router;

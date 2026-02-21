const express = require('express');
const router = express.Router();
const multer = require('multer');
const configuracionController = require('../controllers/configuracionController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', configuracionController.getAll);
router.put('/', configuracionController.update);
router.post('/logo', upload.single('logo'), configuracionController.uploadLogo);
router.delete('/logo', configuracionController.deleteLogo);

module.exports = router;

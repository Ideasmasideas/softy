const express = require('express');
const router = express.Router();
const controller = require('../controllers/facturaRecurrenteController');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.put('/:id/toggle', controller.toggle);

module.exports = router;

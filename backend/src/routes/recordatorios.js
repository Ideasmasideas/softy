const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recordatorioController');

router.get('/hoy', ctrl.getHoy);
router.get('/matriz', ctrl.getMatriz);
router.get('/summary', ctrl.getSummary);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);
router.patch('/:id/toggle', ctrl.toggleComplete);
router.patch('/:id/cuadrante', ctrl.updateCuadrante);

module.exports = router;

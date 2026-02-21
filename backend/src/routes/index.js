const express = require('express');
const router = express.Router();

// Import all route modules
const clientesRoutes = require('./clientes');
const proyectosRoutes = require('./proyectos');
const tareasRoutes = require('./tareas');
const facturasRoutes = require('./facturas');
const usuariosRoutes = require('./usuarios');
const authRoutes = require('./auth');
const configuracionRoutes = require('./configuracion');
const dashboardRoutes = require('./dashboard');
const ganttRoutes = require('./gantt');
const facturasRecurrentesRoutes = require('./facturasRecurrentes');
const gastosRoutes = require('./gastos');
const aiRoutes = require('./ai');
const recordatoriosRoutes = require('./recordatorios');
const gmailRoutes = require('./gmail');

// Mount routes
router.use('/clientes', clientesRoutes);
router.use('/proyectos', proyectosRoutes);
router.use('/tareas', tareasRoutes);
router.use('/facturas', facturasRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/', authRoutes);
router.use('/configuracion', configuracionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/gantt', ganttRoutes);
router.use('/facturas-recurrentes', facturasRecurrentesRoutes);
router.use('/gastos', gastosRoutes);
router.use('/ai', aiRoutes);
router.use('/recordatorios', recordatoriosRoutes);
router.use('/gmail', gmailRoutes);

module.exports = router;

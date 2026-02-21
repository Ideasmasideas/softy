const { generateTaskBreakdown, chatWithData, extractInvoiceData, generateBriefing } = require('../services/aiService');
const fs = require('fs');
const Dashboard = require('../models/Dashboard');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');
const Gasto = require('../models/Gasto');
const Recordatorio = require('../models/Recordatorio');
const { pool } = require('../config/database');

exports.generateTasks = async (req, res) => {
  try {
    const { nombre, descripcion, tipo } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
    }
    const tareas = await generateTaskBreakdown(nombre, descripcion, tipo);
    res.json({ tareas });
  } catch (error) {
    console.error('Error generating tasks:', error);
    res.status(500).json({ error: 'Error al generar tareas con IA' });
  }
};

exports.extractInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const ext = req.file.originalname.toLowerCase().split('.').pop();

    const mimeMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      pdf: 'application/pdf'
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    const data = await extractInvoiceData(fileBuffer, mimeType);

    // Clean up the temp file
    fs.unlink(req.file.path, () => {});

    res.json(data);
  } catch (error) {
    console.error('Error extracting invoice:', error);
    // Clean up on error too
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'Error al extraer datos del documento' });
  }
};

exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'El mensaje es obligatorio' });
    }

    // Gather business context
    const dashboardData = await Dashboard.getStats();

    // Include IDs for clients so AI can reference them
    const [clientesRows] = await pool.query(`
      SELECT c.id, c.nombre, c.empresa,
        COALESCE(SUM(f.total), 0) as total_facturado,
        COUNT(f.id) as num_facturas
      FROM clientes c
      LEFT JOIN facturas f ON f.cliente_id = c.id
      GROUP BY c.id
      ORDER BY total_facturado DESC
      LIMIT 20
    `);

    // Include IDs for projects
    const [proyectosRows] = await pool.query(`
      SELECT p.id, p.nombre, p.estado, p.tipo, p.presupuesto, p.horas_consumidas, c.nombre as cliente
      FROM proyectos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.estado IN ('pendiente', 'en_progreso')
      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    const [gastosRows] = await pool.query(`
      SELECT categoria, COALESCE(SUM(importe), 0) as total
      FROM gastos
      WHERE YEAR(fecha) = YEAR(NOW())
      GROUP BY categoria
    `);

    const [trimestreRows] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN total ELSE 0 END), 0) as ingresos,
        COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN total ELSE 0 END), 0) as gastos
      FROM (
        SELECT total, 'ingreso' as tipo FROM facturas WHERE QUARTER(fecha) = QUARTER(NOW()) AND YEAR(fecha) = YEAR(NOW())
        UNION ALL
        SELECT importe as total, 'gasto' as tipo FROM gastos WHERE QUARTER(fecha) = QUARTER(NOW()) AND YEAR(fecha) = YEAR(NOW())
      ) t
    `);

    const [configRows] = await pool.query('SELECT clave, valor FROM configuracion WHERE clave LIKE "empresa_%"');
    const config = {};
    configRows.forEach(r => config[r.clave] = r.valor);

    const [recordatoriosRows] = await pool.query(`
      SELECT titulo, cuadrante, fecha_vencimiento, categoria, completada
      FROM recordatorios
      WHERE completada = 0
      ORDER BY fecha_vencimiento ASC
      LIMIT 10
    `);

    const contextData = {
      empresa: config,
      resumen: dashboardData.stats,
      clientes_con_id: clientesRows,
      proyectos_con_id: proyectosRows,
      gastos_por_categoria: gastosRows,
      trimestre_actual: trimestreRows[0],
      facturacion_mensual: dashboardData.facturacionMensual,
      recordatorios_pendientes: recordatoriosRows
    };

    const aiResponse = await chatWithData(message, history || [], contextData);

    // If AI returned actions, execute them
    if (aiResponse.type === 'actions' && Array.isArray(aiResponse.actions)) {
      const results = [];
      let lastProjectId = null;

      for (const action of aiResponse.actions) {
        try {
          switch (action.action) {
            case 'create_proyecto': {
              const proyecto = await Proyecto.create({
                cliente_id: action.data.cliente_id,
                nombre: action.data.nombre,
                descripcion: action.data.descripcion || '',
                tipo: action.data.tipo || 'proyecto',
                precio_hora: action.data.precio_hora || 0,
                presupuesto: action.data.presupuesto || 0,
                horas_estimadas: action.data.horas_estimadas || 0
              });
              lastProjectId = proyecto.id;
              results.push({ action: 'create_proyecto', success: true, id: proyecto.id, nombre: proyecto.nombre });
              break;
            }
            case 'create_tarea': {
              const proyectoId = action.data.proyecto_id === 'USE_LAST_PROJECT' ? lastProjectId : action.data.proyecto_id;
              if (!proyectoId) {
                results.push({ action: 'create_tarea', success: false, error: 'No hay proyecto de referencia' });
                break;
              }
              const tarea = await Tarea.create({
                proyecto_id: proyectoId,
                titulo: action.data.titulo,
                descripcion: action.data.descripcion || '',
                horas: action.data.horas || 0,
                grupo: action.data.grupo || null,
                fecha: action.data.fecha || new Date().toISOString().split('T')[0],
                estado: 'pendiente'
              });
              results.push({ action: 'create_tarea', success: true, id: tarea.id, titulo: tarea.titulo });
              break;
            }
            case 'create_gasto': {
              const gasto = await Gasto.create({
                descripcion: action.data.descripcion,
                importe: action.data.importe,
                fecha: action.data.fecha || new Date().toISOString().split('T')[0],
                categoria: action.data.categoria || 'otros',
                proveedor: action.data.proveedor || '',
                iva_soportado: action.data.iva_soportado || 21,
                deducible: action.data.deducible != null ? action.data.deducible : 1
              });
              results.push({ action: 'create_gasto', success: true, id: gasto.id, descripcion: gasto.descripcion });
              break;
            }
            case 'create_recordatorio': {
              const recordatorio = await Recordatorio.create({
                titulo: action.data.titulo,
                descripcion: action.data.descripcion || '',
                cuadrante: action.data.cuadrante || 'hacer_ahora',
                fecha_vencimiento: action.data.fecha_vencimiento || null,
                categoria: action.data.categoria || 'negocio',
                recurrente: action.data.recurrente || 'ninguna',
                fijado: action.data.fijado || 0
              });
              results.push({ action: 'create_recordatorio', success: true, id: recordatorio.id, titulo: recordatorio.titulo });
              break;
            }
            default:
              results.push({ action: action.action, success: false, error: 'Acción no soportada' });
          }
        } catch (err) {
          console.error(`Error executing action ${action.action}:`, err);
          results.push({ action: action.action, success: false, error: err.message });
        }
      }

      // Check if all succeeded
      const allOk = results.every(r => r.success);
      const failed = results.filter(r => !r.success);

      let respuesta = aiResponse.message || 'Acciones ejecutadas.';
      if (!allOk) {
        respuesta += '\n\nAlgunas acciones fallaron: ' + failed.map(f => `${f.action}: ${f.error}`).join(', ');
      }

      res.json({ respuesta, actions: results });
    } else {
      // Plain text response
      res.json({ respuesta: aiResponse.message || aiResponse });
    }
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ error: 'Error al procesar consulta con IA' });
  }
};

// Briefing cache (1 hour TTL)
let briefingCache = { data: null, timestamp: 0 };
const BRIEFING_CACHE_TTL = 60 * 60 * 1000;

exports.briefing = async (req, res) => {
  try {
    const now = Date.now();
    if (briefingCache.data && (now - briefingCache.timestamp) < BRIEFING_CACHE_TTL) {
      return res.json({ briefing: briefingCache.data, cached: true });
    }

    const hoyItems = await Recordatorio.getHoy();
    const summary = await Recordatorio.getSummary();

    const year = new Date().getFullYear();
    let alertasFiscales = [];
    try {
      const fiscalData = await Dashboard.getFiscalData(year);
      alertasFiscales = fiscalData.alertas || [];
    } catch { /* fiscal data not critical */ }

    const [proyectosProximos] = await pool.query(`
      SELECT nombre, estado FROM proyectos
      WHERE estado IN ('pendiente', 'en_progreso')
      ORDER BY created_at DESC LIMIT 5
    `);

    const contextData = {
      recordatorios_hoy: hoyItems.map(r => ({
        titulo: r.titulo,
        cuadrante: r.cuadrante,
        seccion: r.seccion,
        fecha_vencimiento: r.fecha_vencimiento,
        categoria: r.categoria
      })),
      resumen: summary,
      alertas_fiscales: alertasFiscales,
      proyectos_activos: proyectosProximos
    };

    const briefingText = await generateBriefing(contextData);
    briefingCache = { data: briefingText, timestamp: now };

    res.json({ briefing: briefingText, cached: false });
  } catch (error) {
    console.error('Error generating briefing:', error);
    res.status(500).json({ error: 'Error al generar briefing' });
  }
};

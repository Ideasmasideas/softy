const gmailService = require('../services/gmailService');
const { parseEmailToTasks } = require('../services/aiService');
const Cliente = require('../models/Cliente');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');

exports.status = async (req, res) => {
  try {
    const status = await gmailService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting Gmail status:', error);
    res.status(500).json({ error: 'Error al verificar estado de Gmail' });
  }
};

exports.auth = async (req, res) => {
  try {
    const url = gmailService.getAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Error al generar URL de autorizacion' });
  }
};

exports.callback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Codigo de autorizacion no proporcionado' });
    }
    await gmailService.handleCallback(code);
    // Redirect to frontend
    res.redirect('http://localhost:3000/bandeja-email?connected=true');
  } catch (error) {
    console.error('Error in Gmail callback:', error);
    res.redirect('http://localhost:3000/bandeja-email?error=auth_failed');
  }
};

exports.emails = async (req, res) => {
  try {
    const max = parseInt(req.query.max) || 20;
    const q = req.query.q || '';
    const emails = await gmailService.fetchEmails(max, q);
    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    if (error.message === 'Gmail no conectado') {
      return res.status(401).json({ error: 'Gmail no conectado' });
    }
    res.status(500).json({ error: 'Error al obtener emails' });
  }
};

exports.emailDetail = async (req, res) => {
  try {
    const email = await gmailService.getEmailContent(req.params.id);
    res.json(email);
  } catch (error) {
    console.error('Error fetching email detail:', error);
    res.status(500).json({ error: 'Error al obtener detalle del email' });
  }
};

exports.procesar = async (req, res) => {
  try {
    const email = await gmailService.getEmailContent(req.params.id);
    const clientes = await Cliente.findAll();
    const proyectos = await Proyecto.findAll();

    const result = await parseEmailToTasks(
      `Asunto: ${email.subject}\n\n${email.body}`,
      email.fromEmail,
      email.fromName,
      clientes,
      proyectos.filter(p => p.estado !== 'completado')
    );

    res.json({
      email: {
        id: email.id,
        subject: email.subject,
        from: email.from,
        fromName: email.fromName,
        fromEmail: email.fromEmail,
        date: email.date
      },
      ...result
    });
  } catch (error) {
    console.error('Error processing email with AI:', error);
    res.status(500).json({ error: 'Error al procesar email con IA' });
  }
};

exports.crearTareas = async (req, res) => {
  try {
    const { proyecto_id, tareas } = req.body;
    if (!proyecto_id || !tareas || !Array.isArray(tareas) || tareas.length === 0) {
      return res.status(400).json({ error: 'Proyecto y tareas son obligatorios' });
    }

    // Verify project exists
    const proyecto = await Proyecto.findById(proyecto_id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const createdTareas = [];
    const today = new Date().toISOString().split('T')[0];

    for (const tarea of tareas) {
      const created = await Tarea.create({
        proyecto_id,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion || '',
        horas: tarea.horas_estimadas || 0,
        grupo: tarea.grupo || null,
        fecha: today,
        estado: 'pendiente'
      });
      createdTareas.push(created);
    }

    res.json({
      success: true,
      proyecto_id,
      proyecto_nombre: proyecto.nombre,
      tareas_creadas: createdTareas.length,
      tareas: createdTareas
    });
  } catch (error) {
    console.error('Error creating tasks from email:', error);
    res.status(500).json({ error: 'Error al crear tareas' });
  }
};

exports.disconnect = async (req, res) => {
  try {
    await gmailService.disconnect();
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    res.status(500).json({ error: 'Error al desconectar Gmail' });
  }
};

const Recordatorio = require('../models/Recordatorio');

exports.getAll = async (req, res) => {
  try {
    const filters = {
      completada: req.query.completada,
      cuadrante: req.query.cuadrante,
      categoria: req.query.categoria
    };
    const recordatorios = await Recordatorio.findAll(filters);
    res.json(recordatorios);
  } catch (error) {
    console.error('Error fetching recordatorios:', error);
    res.status(500).json({ error: 'Error al obtener recordatorios' });
  }
};

exports.getHoy = async (req, res) => {
  try {
    const items = await Recordatorio.getHoy();
    res.json(items);
  } catch (error) {
    console.error('Error fetching hoy:', error);
    res.status(500).json({ error: 'Error al obtener recordatorios de hoy' });
  }
};

exports.getMatriz = async (req, res) => {
  try {
    const items = await Recordatorio.getByQuadrant();
    res.json(items);
  } catch (error) {
    console.error('Error fetching matriz:', error);
    res.status(500).json({ error: 'Error al obtener matriz' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const summary = await Recordatorio.getSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await Recordatorio.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Recordatorio no encontrado' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching recordatorio:', error);
    res.status(500).json({ error: 'Error al obtener recordatorio' });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.titulo) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }
    const item = await Recordatorio.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating recordatorio:', error);
    res.status(500).json({ error: 'Error al crear recordatorio' });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Recordatorio.update(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    console.error('Error updating recordatorio:', error);
    res.status(500).json({ error: 'Error al actualizar recordatorio' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Recordatorio.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting recordatorio:', error);
    res.status(500).json({ error: 'Error al eliminar recordatorio' });
  }
};

exports.toggleComplete = async (req, res) => {
  try {
    const result = await Recordatorio.toggleComplete(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error toggling recordatorio:', error);
    res.status(500).json({ error: 'Error al actualizar recordatorio' });
  }
};

exports.updateCuadrante = async (req, res) => {
  try {
    const { cuadrante } = req.body;
    if (!cuadrante) {
      return res.status(400).json({ error: 'El cuadrante es obligatorio' });
    }
    const item = await Recordatorio.updateCuadrante(req.params.id, cuadrante);
    res.json(item);
  } catch (error) {
    console.error('Error updating cuadrante:', error);
    res.status(500).json({ error: 'Error al actualizar cuadrante' });
  }
};

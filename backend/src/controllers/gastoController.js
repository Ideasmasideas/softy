const Gasto = require('../models/Gasto');

exports.getAll = async (req, res) => {
  try {
    const gastos = await Gasto.findAll();
    res.json(gastos);
  } catch (error) {
    console.error('Error fetching gastos:', error);
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const gasto = await Gasto.findById(req.params.id);
    if (!gasto) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    res.json(gasto);
  } catch (error) {
    console.error('Error fetching gasto:', error);
    res.status(500).json({ error: 'Error al obtener gasto' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.archivo = req.file.filename;
    }
    const gasto = await Gasto.create(data);
    res.status(201).json(gasto);
  } catch (error) {
    console.error('Error creating gasto:', error);
    res.status(500).json({ error: 'Error al crear gasto' });
  }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.archivo = req.file.filename;
    }
    const gasto = await Gasto.update(req.params.id, data);
    res.json(gasto);
  } catch (error) {
    console.error('Error updating gasto:', error);
    res.status(500).json({ error: 'Error al actualizar gasto' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Gasto.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting gasto:', error);
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
};

exports.getResumenTrimestral = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const resumen = await Gasto.getResumenTrimestral(year);
    res.json(resumen);
  } catch (error) {
    console.error('Error fetching resumen trimestral:', error);
    res.status(500).json({ error: 'Error al obtener resumen trimestral' });
  }
};

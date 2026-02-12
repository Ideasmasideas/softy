const FacturaRecurrente = require('../models/FacturaRecurrente');

exports.getAll = async (req, res) => {
  try {
    const recurrentes = await FacturaRecurrente.findAll();
    res.json(recurrentes);
  } catch (error) {
    console.error('Error fetching facturas recurrentes:', error);
    res.status(500).json({ error: 'Error al obtener facturas recurrentes' });
  }
};

exports.getById = async (req, res) => {
  try {
    const recurrente = await FacturaRecurrente.findById(req.params.id);
    if (!recurrente) {
      return res.status(404).json({ error: 'Factura recurrente no encontrada' });
    }
    res.json(recurrente);
  } catch (error) {
    console.error('Error fetching factura recurrente:', error);
    res.status(500).json({ error: 'Error al obtener factura recurrente' });
  }
};

exports.create = async (req, res) => {
  try {
    const recurrente = await FacturaRecurrente.create(req.body);
    res.status(201).json(recurrente);
  } catch (error) {
    console.error('Error creating factura recurrente:', error);
    res.status(500).json({ error: 'Error al crear factura recurrente' });
  }
};

exports.update = async (req, res) => {
  try {
    const recurrente = await FacturaRecurrente.update(req.params.id, req.body);
    res.json(recurrente);
  } catch (error) {
    console.error('Error updating factura recurrente:', error);
    res.status(500).json({ error: 'Error al actualizar factura recurrente' });
  }
};

exports.delete = async (req, res) => {
  try {
    await FacturaRecurrente.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting factura recurrente:', error);
    res.status(500).json({ error: 'Error al eliminar factura recurrente' });
  }
};

exports.toggle = async (req, res) => {
  try {
    const recurrente = await FacturaRecurrente.toggleActive(req.params.id);
    res.json(recurrente);
  } catch (error) {
    console.error('Error toggling factura recurrente:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

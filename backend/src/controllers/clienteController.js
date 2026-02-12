const Cliente = require('../models/Cliente');

exports.getAll = async (req, res) => {
  try {
    const clientes = await Cliente.findAll();
    res.json(clientes);
  } catch (error) {
    console.error('Error fetching clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

exports.getById = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Error fetching cliente:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

exports.create = async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    console.error('Error creating cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

exports.update = async (req, res) => {
  try {
    const cliente = await Cliente.update(req.params.id, req.body);
    res.json(cliente);
  } catch (error) {
    console.error('Error updating cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Cliente.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};

const Tarea = require('../models/Tarea');

exports.create = async (req, res) => {
  try {
    const tarea = await Tarea.create(req.body);
    res.status(201).json(tarea);
  } catch (error) {
    console.error('Error creating tarea:', error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
};

exports.update = async (req, res) => {
  try {
    const tarea = await Tarea.update(req.params.id, req.body);
    res.json(tarea);
  } catch (error) {
    console.error('Error updating tarea:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Tarea.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tarea:', error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
};

const Proyecto = require('../models/Proyecto');

exports.getAll = async (req, res) => {
  try {
    const proyectos = await Proyecto.findAll();
    res.json(proyectos);
  } catch (error) {
    console.error('Error fetching proyectos:', error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const proyecto = await Proyecto.findById(req.params.id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    res.json(proyecto);
  } catch (error) {
    console.error('Error fetching proyecto:', error);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
};

exports.create = async (req, res) => {
  try {
    const proyecto = await Proyecto.create(req.body);
    res.status(201).json(proyecto);
  } catch (error) {
    console.error('Error creating proyecto:', error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
};

exports.update = async (req, res) => {
  try {
    const proyecto = await Proyecto.update(req.params.id, req.body);
    res.json(proyecto);
  } catch (error) {
    console.error('Error updating proyecto:', error);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Proyecto.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
};

exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await Proyecto.getUsuarios(req.params.id);
    res.json(usuarios);
  } catch (error) {
    console.error('Error fetching proyecto usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios del proyecto' });
  }
};

exports.addUsuario = async (req, res) => {
  try {
    const proyectoUsuario = await Proyecto.addUsuario(req.params.id, req.body);
    res.status(201).json(proyectoUsuario);
  } catch (error) {
    console.error('Error adding usuario to proyecto:', error);
    res.status(500).json({ error: 'Error al agregar usuario al proyecto' });
  }
};

exports.removeUsuario = async (req, res) => {
  try {
    await Proyecto.removeUsuario(req.params.proyectoId, req.params.usuarioId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing usuario from proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar usuario del proyecto' });
  }
};

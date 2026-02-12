const Usuario = require('../models/Usuario');

exports.getAll = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.json(usuarios);
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.getById = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error('Error fetching usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

exports.create = async (req, res) => {
  try {
    const usuario = await Usuario.create(req.body);
    res.status(201).json(usuario);
  } catch (error) {
    console.error('Error creating usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

exports.update = async (req, res) => {
  try {
    const usuario = await Usuario.update(req.params.id, req.body);
    res.json(usuario);
  } catch (error) {
    console.error('Error updating usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Usuario.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.login(email, password);

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

exports.getProyectos = async (req, res) => {
  try {
    const proyectos = await Usuario.getProyectos(req.params.id);
    res.json(proyectos);
  } catch (error) {
    console.error('Error fetching user proyectos:', error);
    res.status(500).json({ error: 'Error al obtener proyectos del usuario' });
  }
};

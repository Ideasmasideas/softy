const Configuracion = require('../models/Configuracion');

exports.getAll = async (req, res) => {
  try {
    const config = await Configuracion.getAll();
    res.json(config);
  } catch (error) {
    console.error('Error fetching configuracion:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

exports.update = async (req, res) => {
  try {
    await Configuracion.update(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating configuracion:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};

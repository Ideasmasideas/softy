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

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningun archivo' });
    }
    const mimeType = req.file.mimetype;
    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;

    await Configuracion.update({ empresa_logo_base64: dataUri });

    res.json({ success: true, logo: dataUri });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Error al subir logo' });
  }
};

exports.deleteLogo = async (req, res) => {
  try {
    await Configuracion.update({ empresa_logo_base64: '' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ error: 'Error al eliminar logo' });
  }
};

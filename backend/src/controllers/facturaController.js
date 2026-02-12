const Factura = require('../models/Factura');
const Configuracion = require('../models/Configuracion');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendInvoiceEmail } = require('../utils/emailSender');

exports.getNextNumber = async (req, res) => {
  try {
    const numero = await Factura.getNextNumber();
    res.json({ numero });
  } catch (error) {
    console.error('Error getting next number:', error);
    res.status(500).json({ error: 'Error al obtener número' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const facturas = await Factura.findAll();
    res.json(facturas);
  } catch (error) {
    console.error('Error fetching facturas:', error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
};

exports.getById = async (req, res) => {
  try {
    const factura = await Factura.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.json(factura);
  } catch (error) {
    console.error('Error fetching factura:', error);
    res.status(500).json({ error: 'Error al obtener factura' });
  }
};

exports.create = async (req, res) => {
  try {
    const factura = await Factura.create(req.body);
    res.status(201).json(factura);
  } catch (error) {
    console.error('Error creating factura:', error);
    res.status(500).json({ error: 'Error al crear factura' });
  }
};

exports.update = async (req, res) => {
  try {
    const factura = await Factura.update(req.params.id, req.body);
    res.json(factura);
  } catch (error) {
    console.error('Error updating factura:', error);
    res.status(500).json({ error: 'Error al actualizar factura' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Factura.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting factura:', error);
    res.status(500).json({ error: 'Error al eliminar factura' });
  }
};

exports.generatePDF = async (req, res) => {
  try {
    const facturaData = await Factura.findById(req.params.id);
    if (!facturaData) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const pdf = await generateInvoicePDF(facturaData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${facturaData.numero}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
};

exports.sendEmail = async (req, res) => {
  try {
    const facturaData = await Factura.findById(req.params.id);
    if (!facturaData) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    if (!facturaData.cliente_email) {
      return res.status(400).json({ error: 'El cliente no tiene email' });
    }

    await sendInvoiceEmail(facturaData);

    // Update invoice status
    await Factura.update(req.params.id, { estado: 'enviada' });

    res.json({ success: true, message: 'Factura enviada correctamente' });
  } catch (error) {
    console.error('Error sending email:', error);
    const errorMsg = error.response?.body?.errors?.[0]?.message || error.message;
    res.status(500).json({ error: 'Error enviando email: ' + errorMsg });
  }
};

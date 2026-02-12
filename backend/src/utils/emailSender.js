const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const { generateInvoicePDF } = require('./pdfGenerator');

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

function getLogoForEmail() {
  const logoPath = path.join(__dirname, '../../public/uploads/logo.png');
  if (fs.existsSync(logoPath)) {
    return fs.readFileSync(logoPath).toString('base64');
  }
  return null;
}

async function sendInvoiceEmail(facturaData) {
  const pdf = await generateInvoicePDF(facturaData);
  const config = facturaData.config;
  const logoBase64 = getLogoForEmail();

  const logoHtml = logoBase64
    ? '<img src="cid:company_logo" alt="Logo" style="max-width:150px;max-height:80px;margin-bottom:16px;" /><br>'
    : '';

  const msg = {
    to: facturaData.cliente_email,
    from: config.empresa_email || process.env.SENDGRID_FROM_EMAIL,
    subject: `Factura ${facturaData.numero} - ${config.empresa_nombre}`,
    html: `
      ${logoHtml}
      <p>Estimado/a ${facturaData.cliente_nombre},</p>
      <p>Adjunto encontrará la factura <strong>${facturaData.numero}</strong> por un importe de <strong>${Number(facturaData.total).toFixed(2)} €</strong>.</p>
      <p>Fecha de vencimiento: ${facturaData.fecha_vencimiento ? new Date(facturaData.fecha_vencimiento).toLocaleDateString('es-ES') : 'No especificada'}</p>
      <p>Gracias por su confianza.</p>
      <p>Saludos,<br>${config.empresa_nombre}</p>
    `,
    attachments: [
      {
        content: pdf.toString('base64'),
        filename: `factura-${facturaData.numero}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      },
      ...(logoBase64 ? [{
        content: logoBase64,
        filename: 'logo.png',
        type: 'image/png',
        disposition: 'inline',
        content_id: 'company_logo'
      }] : [])
    ]
  };

  await sgMail.send(msg);
}

module.exports = { sendInvoiceEmail };

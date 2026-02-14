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

function replaceVariables(template, facturaData, config, logoHtml) {
  const vars = {
    '{cliente}': facturaData.cliente_nombre || '',
    '{empresa_cliente}': facturaData.cliente_empresa || '',
    '{numero}': facturaData.numero || '',
    '{total}': Number(facturaData.total).toFixed(2) + ' €',
    '{subtotal}': Number(facturaData.subtotal).toFixed(2) + ' €',
    '{fecha}': facturaData.fecha || '',
    '{vencimiento}': facturaData.fecha_vencimiento || 'No especificada',
    '{empresa}': config.empresa_nombre || '',
    '{logo}': logoHtml || '',
  };

  let result = template || '';
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(key).join(value);
  }
  return result;
}

async function sendInvoiceEmail(facturaData) {
  const pdf = await generateInvoicePDF(facturaData);
  const config = facturaData.config;
  const logoBase64 = getLogoForEmail();

  const logoHtml = logoBase64
    ? '<img src="cid:company_logo" alt="Logo" style="max-width:150px;max-height:70px;" />'
    : '';

  const subjectTemplate = config.email_asunto || 'Factura {numero} - {empresa}';
  const bodyTemplate = config.email_mensaje || 'Estimado/a {cliente},\n\nAdjunto encontrará la factura {numero} por un importe de {total}.\n\nFecha de vencimiento: {vencimiento}\n\nGracias por su confianza.\n\nSaludos,\n{empresa}';

  const subject = replaceVariables(subjectTemplate, facturaData, config, logoHtml);
  const bodyText = replaceVariables(bodyTemplate, facturaData, config, logoHtml);
  const bodyHtml = bodyText.split('\n').map(line => {
    if (line.includes('<img ')) return line;
    return line ? `<p>${line}</p>` : '<br>';
  }).join('\n');

  const msg = {
    to: facturaData.cliente_email,
    from: config.empresa_email || process.env.SENDGRID_FROM_EMAIL,
    subject,
    html: bodyHtml,
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

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function getLogoBase64() {
  const logoPath = path.join(__dirname, '../../public/uploads/logo.png');
  if (fs.existsSync(logoPath)) {
    const data = fs.readFileSync(logoPath);
    const ext = path.extname(logoPath).slice(1).replace('jpg', 'jpeg');
    return `data:image/${ext};base64,${data.toString('base64')}`;
  }
  return null;
}

function generateInvoiceHTML(factura, lineas, config) {
  const irpfAmount = Number(factura.subtotal) * (Number(factura.irpf) / 100);
  const ivaAmount = Number(factura.subtotal) * (Number(factura.iva) / 100);

  const logoBase64 = getLogoBase64();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 40px; font-size: 13px; }

        /* Logo centered */
        .logo-section { text-align: center; margin-bottom: 24px; }
        .logo { max-width: 160px; max-height: 80px; }
        .website { text-align: center; font-size: 12px; font-weight: 700; color: #333; margin-top: 6px; margin-bottom: 24px; }

        /* Company + Invoice row */
        .info-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .company-info { flex: 1; }
        .company-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
        .company-detail { color: #666; font-size: 12px; line-height: 1.6; }
        .invoice-info { text-align: right; }
        .invoice-title { font-size: 22px; font-weight: 700; margin-bottom: 10px; color: #1a1a1a; }
        .invoice-detail { font-size: 12px; color: #666; margin-bottom: 4px; }
        .invoice-detail strong { color: #333; }
        .invoice-total-header { font-size: 16px; font-weight: 700; margin-top: 12px; color: #1a1a1a; }

        /* Client below company */
        .client-section { margin-bottom: 30px; padding: 16px; background: #f8f9fa; border-radius: 6px; }
        .client-label { font-size: 11px; color: #999; text-transform: uppercase; margin-bottom: 6px; font-weight: 600; }
        .client-name { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
        .client-detail { color: #666; font-size: 12px; line-height: 1.6; }

        /* Table */
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f8f9fa; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; font-weight: 600; }
        th.text-right { text-align: right; }
        td { padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
        .text-right { text-align: right; }

        /* Totals */
        .totals { margin-left: auto; width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
        .total-row.subtotal { border-top: 1px solid #ddd; padding-top: 12px; }
        .total-row.final { border-top: 2px solid #333; margin-top: 8px; padding-top: 12px; font-size: 16px; font-weight: 700; }

        /* Payment */
        .payment-terms { margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 6px; font-size: 12px; line-height: 1.6; color: #666; white-space: pre-line; }
      </style>
    </head>
    <body>

      ${logoBase64 ? `
      <div class="logo-section">
        <img class="logo" src="${logoBase64}" alt="Logo" />
      </div>
      ` : ''}
      <div class="website">www.ideasmasideas.com</div>

      <div class="info-row">
        <div class="company-info">
          <div class="company-name">${config.empresa_nombre || 'Mi Empresa'}</div>
          <div class="company-detail">NIF: ${config.empresa_nif || ''}</div>
          <div class="company-detail">${(config.empresa_direccion || '').replace(/\\n/g, '<br>')}</div>
          ${config.empresa_email ? `<div class="company-detail">${config.empresa_email}</div>` : ''}
        </div>
        <div class="invoice-info">
          <div class="invoice-title">FACTURA</div>
          <div class="invoice-detail"><strong>N\u00ba</strong> ${factura.numero}</div>
          <div class="invoice-detail"><strong>Fecha:</strong> ${new Date(factura.fecha).toLocaleDateString('es-ES')}</div>
          ${factura.fecha_vencimiento ? `<div class="invoice-detail"><strong>Vencimiento:</strong> ${new Date(factura.fecha_vencimiento).toLocaleDateString('es-ES')}</div>` : ''}
          <div class="invoice-total-header">${Number(factura.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} \u20ac</div>
        </div>
      </div>

      <div class="client-section">
        <div class="client-label">Facturar a</div>
        <div class="client-name">${factura.cliente_nombre || ''}</div>
        <div class="client-detail">
          ${factura.cliente_nif ? 'NIF: ' + factura.cliente_nif + '<br>' : ''}
          ${factura.cliente_direccion ? factura.cliente_direccion : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Descripci\u00f3n</th>
            <th class="text-right" style="width: 10%;">Uds</th>
            <th class="text-right" style="width: 20%;">Precio ud.</th>
            <th class="text-right" style="width: 20%;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${lineas.map(l => `
            <tr>
              <td>${l.concepto}</td>
              <td class="text-right">${l.cantidad}</td>
              <td class="text-right">${Number(l.precio_unitario).toLocaleString('es-ES', { minimumFractionDigits: 2 })} \u20ac</td>
              <td class="text-right">${Number(l.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} \u20ac</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row subtotal">
          <span>Subtotal</span>
          <span>${Number(factura.subtotal).toLocaleString('es-ES', { minimumFractionDigits: 2 })} \u20ac</span>
        </div>
        <div class="total-row">
          <span>Retenci\u00f3n IRPF ${factura.irpf}%</span>
          <span>-${irpfAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} \u20ac</span>
        </div>
        <div class="total-row">
          <span>IVA ${factura.iva}%</span>
          <span>${ivaAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} \u20ac</span>
        </div>
        <div class="total-row final">
          <span>Total</span>
          <span>${Number(factura.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} \u20ac</span>
        </div>
      </div>

      <div class="payment-terms">Forma de pago: Transferencia bancaria
IBAN: ${config.empresa_iban || ''}
BIC: ${config.empresa_bic || ''}${factura.notas ? '\n\n' + factura.notas : ''}</div>
    </body>
    </html>
  `;
}

async function generateInvoicePDF(facturaData) {
  const html = generateInvoiceHTML(facturaData, facturaData.lineas, facturaData.config);

  const launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const browser = await puppeteer.launch(launchOptions);

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return pdf;
}

module.exports = { generateInvoicePDF };

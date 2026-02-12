const cron = require('node-cron');
const FacturaRecurrente = require('../models/FacturaRecurrente');
const Factura = require('../models/Factura');
const { sendInvoiceEmail } = require('../utils/emailSender');

function toYMD(date) {
  return date.toISOString().split('T')[0];
}

async function processRecurringInvoices() {
  const hoy = new Date();
  const dia = hoy.getDate();
  const fechaStr = toYMD(hoy);

  console.log(`[Scheduler] Checking recurring invoices for day ${dia}...`);

  try {
    const pendientes = await FacturaRecurrente.findPendientes(dia);

    if (pendientes.length === 0) {
      console.log('[Scheduler] No pending recurring invoices today.');
      return;
    }

    console.log(`[Scheduler] Found ${pendientes.length} recurring invoice(s) to process.`);

    for (const recurrente of pendientes) {
      try {
        // Build invoice data from recurring template
        const lineas = recurrente.lineas.map(l => ({
          concepto: l.concepto,
          cantidad: Number(l.cantidad),
          precio_unitario: Number(l.precio_unitario)
        }));

        const venc = new Date(hoy);
        venc.setDate(venc.getDate() + 30);
        const fechaVencimiento = toYMD(venc);

        const facturaData = {
          cliente_id: recurrente.cliente_id,
          proyecto_id: recurrente.proyecto_id,
          fecha: fechaStr,
          fecha_vencimiento: fechaVencimiento,
          iva: Number(recurrente.iva),
          irpf: Number(recurrente.irpf),
          notas: recurrente.notas || '',
          lineas
        };

        // Create the invoice
        const factura = await Factura.create(facturaData);
        console.log(`[Scheduler] Created invoice #${factura.numero} for recurring ${recurrente.id.substring(0, 8)}`);

        // Load full invoice data (with client info, config, etc.)
        const facturaCompleta = await Factura.findById(factura.id);

        // Send email
        if (facturaCompleta.cliente_email) {
          try {
            await sendInvoiceEmail(facturaCompleta);
            await Factura.update(factura.id, { estado: 'enviada' });
            console.log(`[Scheduler] Email sent for invoice #${factura.numero} to ${facturaCompleta.cliente_email}`);
          } catch (emailError) {
            console.error(`[Scheduler] Email failed for #${factura.numero}:`, emailError.message);
          }
        } else {
          console.log(`[Scheduler] No email for client, invoice #${factura.numero} saved as borrador`);
        }

        // Update last generation date
        await FacturaRecurrente.updateUltimaGeneracion(recurrente.id, fechaStr);

      } catch (err) {
        console.error(`[Scheduler] Error processing recurring ${recurrente.id}:`, err.message);
      }
    }

    console.log('[Scheduler] Done processing recurring invoices.');
  } catch (error) {
    console.error('[Scheduler] Error:', error.message);
  }
}

function startScheduler() {
  // Run every day at 08:00
  cron.schedule('0 8 * * *', () => {
    console.log(`[Scheduler] Running daily check at ${new Date().toISOString()}`);
    processRecurringInvoices();
  });

  console.log('📅 Invoice scheduler started (daily at 08:00)');
}

module.exports = { startScheduler, processRecurringInvoices };

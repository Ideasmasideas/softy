const cron = require('node-cron');
const FacturaRecurrente = require('../models/FacturaRecurrente');
const Factura = require('../models/Factura');
const EmailLog = require('../models/EmailLog');
const { sendInvoiceEmail } = require('../utils/emailSender');

function toYMD(date) {
  return date.toISOString().split('T')[0];
}

async function processScheduledInvoices() {
  const hoy = toYMD(new Date());
  console.log(`[Scheduler] Checking scheduled invoices for ${hoy}...`);

  try {
    const programadas = await Factura.findProgramadas(hoy);

    if (programadas.length === 0) {
      console.log('[Scheduler] No scheduled invoices to send today.');
      return;
    }

    console.log(`[Scheduler] Found ${programadas.length} scheduled invoice(s) to send.`);

    for (const factura of programadas) {
      try {
        const facturaCompleta = await Factura.findById(factura.id);

        if (facturaCompleta.cliente_email) {
          await sendInvoiceEmail(facturaCompleta);
          await Factura.update(factura.id, { estado: 'enviada' });

          await EmailLog.create({
            factura_id: factura.id,
            factura_numero: factura.numero,
            destinatario: facturaCompleta.cliente_email,
            asunto: `Factura ${factura.numero} - ${facturaCompleta.config?.empresa_nombre || ''}`,
            estado: 'enviado'
          });

          console.log(`[Scheduler] Scheduled invoice #${factura.numero} sent to ${facturaCompleta.cliente_email}`);
        } else {
          console.log(`[Scheduler] No email for client, invoice #${factura.numero} skipped`);
        }
      } catch (err) {
        console.error(`[Scheduler] Error sending scheduled #${factura.numero}:`, err.message);
        await EmailLog.create({
          factura_id: factura.id,
          factura_numero: factura.numero,
          destinatario: factura.cliente_email || 'desconocido',
          asunto: `Factura ${factura.numero}`,
          estado: 'error',
          error_mensaje: err.message
        }).catch(() => {});
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error processing scheduled invoices:', error.message);
  }
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

        const factura = await Factura.create(facturaData);
        console.log(`[Scheduler] Created invoice #${factura.numero} for recurring ${recurrente.id.substring(0, 8)}`);

        const facturaCompleta = await Factura.findById(factura.id);

        if (facturaCompleta.cliente_email) {
          try {
            await sendInvoiceEmail(facturaCompleta);
            await Factura.update(factura.id, { estado: 'enviada' });

            await EmailLog.create({
              factura_id: factura.id,
              factura_numero: factura.numero,
              destinatario: facturaCompleta.cliente_email,
              asunto: `Factura ${factura.numero} - ${facturaCompleta.config?.empresa_nombre || ''}`,
              estado: 'enviado'
            });

            console.log(`[Scheduler] Email sent for invoice #${factura.numero} to ${facturaCompleta.cliente_email}`);
          } catch (emailError) {
            console.error(`[Scheduler] Email failed for #${factura.numero}:`, emailError.message);
            await EmailLog.create({
              factura_id: factura.id,
              factura_numero: factura.numero,
              destinatario: facturaCompleta.cliente_email,
              asunto: `Factura ${factura.numero}`,
              estado: 'error',
              error_mensaje: emailError.message
            }).catch(() => {});
          }
        } else {
          console.log(`[Scheduler] No email for client, invoice #${factura.numero} saved as borrador`);
        }

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

async function runAll() {
  await processScheduledInvoices();
  await processRecurringInvoices();
}

function startScheduler() {
  // Run every day at 08:00
  cron.schedule('0 8 * * *', () => {
    console.log(`[Scheduler] Running daily check at ${new Date().toISOString()}`);
    runAll();
  });

  console.log('📅 Invoice scheduler started (daily at 08:00)');
}

module.exports = { startScheduler, processRecurringInvoices, processScheduledInvoices, runAll };

const { testConnection } = require('../../src/config/database');
const { initializeDatabase } = require('../../src/config/initDatabase');
const { runAll } = require('../../src/services/invoiceScheduler');

module.exports = async function handler(req, res) {
  // Verify the request comes from Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await testConnection();
    await initializeDatabase();
    await runAll();
    res.json({ success: true, message: 'Scheduled and recurring invoices processed' });
  } catch (error) {
    console.error('Cron error:', error);
    res.status(500).json({ error: error.message });
  }
};

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./src/config/database');
const { initializeDatabase } = require('./src/config/initDatabase');
const apiRoutes = require('./src/routes');
const { startScheduler, processRecurringInvoices } = require('./src/services/invoiceScheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Manual trigger for recurring invoices (for testing)
app.post('/api/scheduler/run', async (req, res) => {
  try {
    await processRecurringInvoices();
    res.json({ success: true, message: 'Scheduler executed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();

    // Initialize database tables and default data
    await initializeDatabase();

    // Start invoice scheduler
    startScheduler();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
      console.log(`💚 Health check at http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

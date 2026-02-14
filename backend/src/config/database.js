const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true
});

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ MySQL database connected successfully');
    connection.release();
  } catch (error) {
    console.error('✗ Error connecting to MySQL database:', error.message);
    throw error;
  }
};

module.exports = { pool, testConnection };

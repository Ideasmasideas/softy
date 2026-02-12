require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing MySQL connection...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  console.log('');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    });

    console.log('✓ Connection successful!');

    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('✓ Query test successful:', rows[0].result);

    await connection.end();
    console.log('✓ Connection closed successfully');

  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.error('\nPlease check:');
    console.error('  1. MySQL server is running');
    console.error('  2. Host and port are correct');
    console.error('  3. Credentials are valid');
    console.error('  4. Firewall allows connection');
    console.error('  5. Database exists');
    process.exit(1);
  }
}

testConnection();

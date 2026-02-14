const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class EmailLog {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT * FROM email_log ORDER BY created_at DESC
    `);
    return rows;
  }

  static async create({ factura_id, factura_numero, destinatario, asunto, estado = 'enviado', error_mensaje = null }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO email_log (id, factura_id, factura_numero, destinatario, asunto, estado, error_mensaje) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, factura_id, factura_numero, destinatario, asunto, estado, error_mensaje]
    );
    return { id, factura_id, factura_numero, destinatario, asunto, estado };
  }
}

module.exports = EmailLog;

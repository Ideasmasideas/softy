const { pool } = require('../config/database');

class Configuracion {
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM configuracion');
    const config = {};
    rows.forEach(c => config[c.clave] = c.valor);
    return config;
  }

  static async update(data) {
    for (const [clave, valor] of Object.entries(data)) {
      await pool.query(
        'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
        [clave, valor, valor]
      );
    }
    return { success: true };
  }
}

module.exports = Configuracion;

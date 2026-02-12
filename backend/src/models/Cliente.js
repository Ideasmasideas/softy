const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Cliente {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT c.*,
             COUNT(DISTINCT p.id) as total_proyectos,
             COALESCE(SUM(CASE WHEN f.estado = 'pagada' THEN f.total ELSE 0 END), 0) as facturado
      FROM clientes c
      LEFT JOIN proyectos p ON c.id = p.cliente_id
      LEFT JOIN facturas f ON c.id = f.cliente_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { nombre, email, telefono, empresa, direccion, nif } = data;
    const id = uuidv4();

    await pool.query(
      'INSERT INTO clientes (id, nombre, email, telefono, empresa, direccion, nif) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, nombre, email, telefono, empresa, direccion, nif]
    );

    return await this.findById(id);
  }

  static async update(id, data) {
    const { nombre, email, telefono, empresa, direccion, nif } = data;

    await pool.query(
      'UPDATE clientes SET nombre=?, email=?, telefono=?, empresa=?, direccion=?, nif=? WHERE id=?',
      [nombre, email, telefono, empresa, direccion, nif, id]
    );

    return await this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
    return { success: true };
  }
}

module.exports = Cliente;

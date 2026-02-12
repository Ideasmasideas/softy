const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class FacturaRecurrente {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT fr.*, c.nombre as cliente_nombre, c.empresa as cliente_empresa
      FROM facturas_recurrentes fr
      LEFT JOIN clientes c ON fr.cliente_id = c.id
      ORDER BY fr.created_at DESC
    `);

    // Add first line concepto as summary
    for (const row of rows) {
      const [lineas] = await pool.query(
        'SELECT concepto FROM factura_recurrente_lineas WHERE factura_recurrente_id = ? LIMIT 1',
        [row.id]
      );
      row.concepto_resumen = lineas[0]?.concepto || '';

      const [allLineas] = await pool.query(
        'SELECT cantidad, precio_unitario FROM factura_recurrente_lineas WHERE factura_recurrente_id = ?',
        [row.id]
      );
      row.subtotal = allLineas.reduce((sum, l) => sum + Number(l.cantidad) * Number(l.precio_unitario), 0);
    }

    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT fr.*, c.nombre as cliente_nombre, c.empresa as cliente_empresa
      FROM facturas_recurrentes fr
      LEFT JOIN clientes c ON fr.cliente_id = c.id
      WHERE fr.id = ?
    `, [id]);

    if (!rows[0]) return null;

    const [lineas] = await pool.query(
      'SELECT * FROM factura_recurrente_lineas WHERE factura_recurrente_id = ?',
      [id]
    );

    return { ...rows[0], lineas };
  }

  static async create(data) {
    const { cliente_id, proyecto_id, dia_mes, iva, irpf, notas, lineas } = data;
    const id = uuidv4();

    await pool.query(
      'INSERT INTO facturas_recurrentes (id, cliente_id, proyecto_id, dia_mes, iva, irpf, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, cliente_id, proyecto_id || null, dia_mes, iva || 21, irpf || 15, notas || null]
    );

    for (const linea of (lineas || [])) {
      await pool.query(
        'INSERT INTO factura_recurrente_lineas (id, factura_recurrente_id, concepto, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), id, linea.concepto, linea.cantidad || 1, linea.precio_unitario]
      );
    }

    return this.findById(id);
  }

  static async update(id, data) {
    const { cliente_id, proyecto_id, dia_mes, iva, irpf, notas, lineas } = data;

    await pool.query(
      'UPDATE facturas_recurrentes SET cliente_id=?, proyecto_id=?, dia_mes=?, iva=?, irpf=?, notas=? WHERE id=?',
      [cliente_id, proyecto_id || null, dia_mes, iva || 21, irpf || 15, notas || null, id]
    );

    if (lineas) {
      await pool.query('DELETE FROM factura_recurrente_lineas WHERE factura_recurrente_id = ?', [id]);
      for (const linea of lineas) {
        await pool.query(
          'INSERT INTO factura_recurrente_lineas (id, factura_recurrente_id, concepto, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), id, linea.concepto, linea.cantidad || 1, linea.precio_unitario]
        );
      }
    }

    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM factura_recurrente_lineas WHERE factura_recurrente_id = ?', [id]);
    await pool.query('DELETE FROM facturas_recurrentes WHERE id = ?', [id]);
    return { success: true };
  }

  static async toggleActive(id) {
    await pool.query('UPDATE facturas_recurrentes SET activa = NOT activa WHERE id = ?', [id]);
    const [rows] = await pool.query('SELECT * FROM facturas_recurrentes WHERE id = ?', [id]);
    return rows[0];
  }

  static async findPendientes(dia) {
    const [rows] = await pool.query(`
      SELECT fr.*
      FROM facturas_recurrentes fr
      WHERE fr.activa = 1
        AND fr.dia_mes = ?
        AND (fr.ultima_generacion IS NULL OR MONTH(fr.ultima_generacion) != MONTH(CURDATE()) OR YEAR(fr.ultima_generacion) != YEAR(CURDATE()))
    `, [dia]);

    // Load lineas for each
    for (const row of rows) {
      const [lineas] = await pool.query(
        'SELECT * FROM factura_recurrente_lineas WHERE factura_recurrente_id = ?',
        [row.id]
      );
      row.lineas = lineas;
    }

    return rows;
  }

  static async updateUltimaGeneracion(id, fecha) {
    await pool.query('UPDATE facturas_recurrentes SET ultima_generacion = ? WHERE id = ?', [fecha, id]);
  }
}

module.exports = FacturaRecurrente;

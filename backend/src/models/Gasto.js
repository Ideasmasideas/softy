const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

function toDateString(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const str = String(val);
  if (str.includes('T')) return str.split('T')[0];
  return str;
}

class Gasto {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT g.*, p.nombre as proyecto_nombre, c.nombre as cliente_nombre, c.empresa as cliente_empresa
      FROM gastos g
      LEFT JOIN proyectos p ON g.proyecto_id = p.id
      LEFT JOIN clientes c ON g.cliente_id = c.id
      ORDER BY g.fecha DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT g.*, p.nombre as proyecto_nombre, c.nombre as cliente_nombre, c.empresa as cliente_empresa
      FROM gastos g
      LEFT JOIN proyectos p ON g.proyecto_id = p.id
      LEFT JOIN clientes c ON g.cliente_id = c.id
      WHERE g.id = ?
    `, [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const id = uuidv4();
    const {
      descripcion, importe, fecha, categoria = 'otros',
      iva_soportado = 21, proyecto_id, cliente_id,
      proveedor, numero_factura, deducible = 1, archivo, notas
    } = data;

    const importeNum = parseFloat(importe);
    const ivaNum = parseFloat(iva_soportado);
    const base_imponible = data.base_imponible
      ? parseFloat(data.base_imponible)
      : importeNum / (1 + ivaNum / 100);

    await pool.query(
      `INSERT INTO gastos (id, descripcion, importe, fecha, categoria, iva_soportado, base_imponible,
        proyecto_id, cliente_id, proveedor, numero_factura, deducible, archivo, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, descripcion, importeNum, toDateString(fecha), categoria,
        ivaNum, base_imponible,
        proyecto_id || null, cliente_id || null,
        proveedor || null, numero_factura || null,
        deducible ? 1 : 0, archivo || null, notas || null
      ]
    );

    const [rows] = await pool.query('SELECT * FROM gastos WHERE id = ?', [id]);
    return rows[0];
  }

  static async update(id, data) {
    const setClauses = [];
    const values = [];

    const fields = {
      descripcion: v => v,
      importe: v => parseFloat(v),
      fecha: v => toDateString(v),
      categoria: v => v,
      iva_soportado: v => parseFloat(v),
      base_imponible: v => parseFloat(v),
      proyecto_id: v => v || null,
      cliente_id: v => v || null,
      proveedor: v => v || null,
      numero_factura: v => v || null,
      deducible: v => v ? 1 : 0,
      archivo: v => v || null,
      notas: v => v || null
    };

    for (const [field, handler] of Object.entries(fields)) {
      if (data[field] !== undefined) {
        setClauses.push(`${field}=?`);
        values.push(handler(data[field]));
      }
    }

    // Auto-recalculate base_imponible if importe or iva changed but base not explicitly set
    if ((data.importe !== undefined || data.iva_soportado !== undefined) && data.base_imponible === undefined) {
      const [current] = await pool.query('SELECT importe, iva_soportado FROM gastos WHERE id = ?', [id]);
      if (current[0]) {
        const imp = data.importe !== undefined ? parseFloat(data.importe) : parseFloat(current[0].importe);
        const iva = data.iva_soportado !== undefined ? parseFloat(data.iva_soportado) : parseFloat(current[0].iva_soportado);
        setClauses.push('base_imponible=?');
        values.push(imp / (1 + iva / 100));
      }
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.query(`UPDATE gastos SET ${setClauses.join(', ')} WHERE id=?`, values);

    return this.findById(id);
  }

  static async delete(id) {
    const [rows] = await pool.query('SELECT archivo FROM gastos WHERE id = ?', [id]);
    if (rows[0]?.archivo) {
      const filePath = path.join(__dirname, '../../public/uploads/gastos', rows[0].archivo);
      fs.unlink(filePath, () => {}); // ignore errors
    }
    await pool.query('DELETE FROM gastos WHERE id = ?', [id]);
    return { success: true };
  }

  static async getResumenTrimestral(year) {
    const [rows] = await pool.query(`
      SELECT
        QUARTER(fecha) as trimestre,
        COUNT(*) as total_gastos,
        COALESCE(SUM(importe), 0) as total_importe,
        COALESCE(SUM(base_imponible), 0) as total_base,
        COALESCE(SUM(CASE WHEN deducible = 1 THEN importe ELSE 0 END), 0) as total_deducible,
        COALESCE(SUM(CASE WHEN deducible = 1 THEN base_imponible * iva_soportado / 100 ELSE 0 END), 0) as total_iva_soportado
      FROM gastos
      WHERE YEAR(fecha) = ?
      GROUP BY QUARTER(fecha)
      ORDER BY trimestre
    `, [year]);
    return rows;
  }

  static async getResumenMensual() {
    const [rows] = await pool.query(`
      SELECT
        COALESCE(SUM(importe), 0) as total_importe,
        COALESCE(SUM(base_imponible), 0) as total_base,
        COALESCE(SUM(CASE WHEN deducible = 1 THEN base_imponible * iva_soportado / 100 ELSE 0 END), 0) as total_iva_soportado
      FROM gastos
      WHERE DATE_FORMAT(fecha, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `);
    return rows[0];
  }

  static async getByCategoria(year) {
    const [rows] = await pool.query(`
      SELECT categoria, COALESCE(SUM(importe), 0) as total
      FROM gastos
      WHERE YEAR(fecha) = ?
      GROUP BY categoria
      ORDER BY total DESC
    `, [year]);
    return rows;
  }
}

module.exports = Gasto;

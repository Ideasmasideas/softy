const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function toDateString(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const str = String(val);
  if (str.includes('T')) return str.split('T')[0];
  return str;
}

class Recordatorio {
  static async findAll(filters = {}) {
    let where = '1=1';
    const params = [];

    if (filters.completada !== undefined && filters.completada !== '') {
      where += ' AND r.completada = ?';
      params.push(Number(filters.completada));
    }
    if (filters.cuadrante) {
      where += ' AND r.cuadrante = ?';
      params.push(filters.cuadrante);
    }
    if (filters.categoria) {
      where += ' AND r.categoria = ?';
      params.push(filters.categoria);
    }

    const [rows] = await pool.query(`
      SELECT r.*, p.nombre as proyecto_nombre
      FROM recordatorios r
      LEFT JOIN proyectos p ON r.proyecto_id = p.id
      WHERE ${where}
      ORDER BY r.completada ASC, r.fecha_vencimiento ASC, r.created_at DESC
    `, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT r.*, p.nombre as proyecto_nombre
      FROM recordatorios r
      LEFT JOIN proyectos p ON r.proyecto_id = p.id
      WHERE r.id = ?
    `, [id]);
    return rows[0] || null;
  }

  static async getHoy() {
    const [rows] = await pool.query(`
      SELECT r.*, p.nombre as proyecto_nombre,
        CASE
          WHEN r.fecha_vencimiento < CURDATE() THEN 'vencido'
          WHEN r.fecha_vencimiento = CURDATE() THEN 'hoy'
          ELSE 'fijado'
        END as seccion
      FROM recordatorios r
      LEFT JOIN proyectos p ON r.proyecto_id = p.id
      WHERE r.completada = 0
        AND (
          r.fecha_vencimiento <= CURDATE()
          OR r.fijado = 1
        )
      ORDER BY
        FIELD(
          CASE
            WHEN r.fecha_vencimiento < CURDATE() THEN 'vencido'
            WHEN r.fecha_vencimiento = CURDATE() THEN 'hoy'
            ELSE 'fijado'
          END,
          'vencido', 'hoy', 'fijado'
        ),
        FIELD(r.cuadrante, 'hacer_ahora', 'programar', 'rapido', 'algun_dia'),
        r.fecha_vencimiento ASC
    `);
    return rows;
  }

  static async getByQuadrant() {
    const [rows] = await pool.query(`
      SELECT r.*, p.nombre as proyecto_nombre
      FROM recordatorios r
      LEFT JOIN proyectos p ON r.proyecto_id = p.id
      WHERE r.completada = 0
      ORDER BY
        FIELD(r.cuadrante, 'hacer_ahora', 'programar', 'rapido', 'algun_dia'),
        r.fecha_vencimiento ASC, r.created_at DESC
    `);
    return rows;
  }

  static async getSummary() {
    const [rows] = await pool.query(`
      SELECT
        SUM(CASE WHEN completada = 0 AND fecha_vencimiento < CURDATE() THEN 1 ELSE 0 END) as vencidos,
        SUM(CASE WHEN completada = 0 AND cuadrante = 'hacer_ahora' THEN 1 ELSE 0 END) as urgentes,
        SUM(CASE WHEN completada = 0 THEN 1 ELSE 0 END) as pendientes,
        MIN(CASE WHEN completada = 0 AND fecha_vencimiento >= CURDATE() THEN fecha_vencimiento END) as proxima_fecha
      FROM recordatorios
    `);
    return rows[0];
  }

  static async create(data) {
    const id = uuidv4();
    const {
      titulo, descripcion, cuadrante = 'hacer_ahora',
      fecha_vencimiento, recurrente = 'ninguna',
      completada = 0, categoria = 'negocio',
      fijado = 0, proyecto_id, notas
    } = data;

    await pool.query(
      `INSERT INTO recordatorios (id, titulo, descripcion, cuadrante, fecha_vencimiento,
        recurrente, completada, categoria, fijado, proyecto_id, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, titulo, descripcion || null, cuadrante,
        toDateString(fecha_vencimiento),
        recurrente, completada ? 1 : 0, categoria,
        fijado ? 1 : 0, proyecto_id || null, notas || null
      ]
    );

    const [rows] = await pool.query('SELECT * FROM recordatorios WHERE id = ?', [id]);
    return rows[0];
  }

  static async update(id, data) {
    const setClauses = [];
    const values = [];

    const fields = {
      titulo: v => v,
      descripcion: v => v || null,
      cuadrante: v => v,
      fecha_vencimiento: v => toDateString(v),
      recurrente: v => v,
      completada: v => v ? 1 : 0,
      categoria: v => v,
      fijado: v => v ? 1 : 0,
      proyecto_id: v => v || null,
      notas: v => v || null
    };

    for (const [field, handler] of Object.entries(fields)) {
      if (data[field] !== undefined) {
        setClauses.push(`${field}=?`);
        values.push(handler(data[field]));
      }
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.query(`UPDATE recordatorios SET ${setClauses.join(', ')} WHERE id=?`, values);
    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM recordatorios WHERE id = ?', [id]);
    return { success: true };
  }

  static async toggleComplete(id) {
    const item = await this.findById(id);
    if (!item) throw new Error('Recordatorio no encontrado');

    const newState = item.completada ? 0 : 1;

    // If completing a recurring item, create the next occurrence first
    if (newState === 1 && item.recurrente && item.recurrente !== 'ninguna') {
      await this.handleRecurrente(item);
    }

    await pool.query('UPDATE recordatorios SET completada = ? WHERE id = ?', [newState, id]);
    return this.findById(id);
  }

  static async handleRecurrente(item) {
    const base = item.fecha_vencimiento ? new Date(item.fecha_vencimiento) : new Date();
    let nextDate = new Date(base);

    switch (item.recurrente) {
      case 'diario':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'semanal':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'mensual':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'trimestral':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'semestral':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'anual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        return null;
    }

    return this.create({
      titulo: item.titulo,
      descripcion: item.descripcion,
      cuadrante: item.cuadrante,
      fecha_vencimiento: toDateString(nextDate),
      recurrente: item.recurrente,
      categoria: item.categoria,
      fijado: item.fijado,
      proyecto_id: item.proyecto_id,
      notas: item.notas
    });
  }

  static async updateCuadrante(id, cuadrante) {
    await pool.query('UPDATE recordatorios SET cuadrante = ? WHERE id = ?', [cuadrante, id]);
    return this.findById(id);
  }
}

module.exports = Recordatorio;

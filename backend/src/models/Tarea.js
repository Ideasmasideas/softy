const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function toDateString(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const str = String(val);
  if (str.includes('T')) return str.split('T')[0];
  return str;
}

class Tarea {
  static async create(data) {
    const { proyecto_id, titulo, descripcion, horas, fecha, grupo, responsable, estado, fecha_fin } = data;
    const id = uuidv4();

    await pool.query(
      'INSERT INTO tareas (id, proyecto_id, titulo, descripcion, horas, fecha, grupo, responsable, estado, fecha_fin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, proyecto_id, titulo, descripcion, horas || 0, toDateString(fecha), grupo || null, responsable || null, estado || 'pendiente', toDateString(fecha_fin)]
    );

    // Update project hours
    await this.updateProjectHours(proyecto_id);

    const [rows] = await pool.query('SELECT * FROM tareas WHERE id = ?', [id]);
    return rows[0];
  }

  static async update(id, data) {
    const [tareaRows] = await pool.query('SELECT proyecto_id FROM tareas WHERE id = ?', [id]);
    if (!tareaRows[0]) {
      throw new Error('Tarea no encontrada');
    }

    // Build dynamic SET clause - only update fields that are provided
    const setClauses = [];
    const values = [];

    const fieldHandlers = {
      titulo: v => v,
      descripcion: v => v,
      horas: v => v,
      completada: v => v ? 1 : 0,
      fecha: v => toDateString(v),
      grupo: v => v || null,
      responsable: v => v || null,
      estado: v => v || 'pendiente',
      fecha_fin: v => toDateString(v)
    };

    for (const [field, handler] of Object.entries(fieldHandlers)) {
      if (data[field] !== undefined) {
        setClauses.push(`${field}=?`);
        values.push(handler(data[field]));
      }
    }

    if (setClauses.length === 0) {
      return tareaRows[0];
    }

    values.push(id);
    await pool.query(`UPDATE tareas SET ${setClauses.join(', ')} WHERE id=?`, values);

    // Update project hours only if horas changed
    if (data.horas !== undefined) {
      await this.updateProjectHours(tareaRows[0].proyecto_id);
    }

    const [rows] = await pool.query('SELECT * FROM tareas WHERE id = ?', [id]);
    return rows[0];
  }

  static async delete(id) {
    const [tareaRows] = await pool.query('SELECT proyecto_id FROM tareas WHERE id = ?', [id]);
    await pool.query('DELETE FROM tareas WHERE id = ?', [id]);

    if (tareaRows[0]) {
      await this.updateProjectHours(tareaRows[0].proyecto_id);
    }

    return { success: true };
  }

  static async updateProjectHours(proyectoId) {
    const [result] = await pool.query(
      'SELECT COALESCE(SUM(horas), 0) as total FROM tareas WHERE proyecto_id = ?',
      [proyectoId]
    );

    await pool.query(
      'UPDATE proyectos SET horas_consumidas = ? WHERE id = ?',
      [result[0].total, proyectoId]
    );
  }
}

module.exports = Tarea;

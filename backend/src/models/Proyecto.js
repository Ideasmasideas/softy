const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Proyecto {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT p.*, c.nombre as cliente_nombre, c.empresa as cliente_empresa,
             (SELECT COUNT(*) FROM tareas WHERE proyecto_id = p.id) as total_tareas,
             (SELECT COUNT(*) FROM tareas WHERE proyecto_id = p.id AND completada = 1) as tareas_completadas,
             (SELECT COALESCE(SUM(horas), 0) FROM tareas WHERE proyecto_id = p.id) as horas_registradas
      FROM proyectos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT p.*, c.nombre as cliente_nombre, c.empresa as cliente_empresa
      FROM proyectos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (!rows[0]) return null;

    const [tareas] = await pool.query(
      'SELECT * FROM tareas WHERE proyecto_id = ? ORDER BY created_at DESC',
      [id]
    );

    return { ...rows[0], tareas };
  }

  static async create(data) {
    const { cliente_id, nombre, descripcion, tipo, precio_hora, presupuesto, horas_estimadas } = data;
    const id = uuidv4();

    await pool.query(
      'INSERT INTO proyectos (id, cliente_id, nombre, descripcion, tipo, precio_hora, presupuesto, horas_estimadas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, cliente_id, nombre, descripcion, tipo, precio_hora || 0, presupuesto || 0, horas_estimadas || 0]
    );

    const [rows] = await pool.query('SELECT * FROM proyectos WHERE id = ?', [id]);
    return rows[0];
  }

  static async update(id, data) {
    const { nombre, descripcion, tipo, precio_hora, presupuesto, horas_estimadas, estado } = data;

    await pool.query(
      'UPDATE proyectos SET nombre=?, descripcion=?, tipo=?, precio_hora=?, presupuesto=?, horas_estimadas=?, estado=? WHERE id=?',
      [nombre, descripcion, tipo, precio_hora, presupuesto, horas_estimadas, estado, id]
    );

    const [rows] = await pool.query('SELECT * FROM proyectos WHERE id = ?', [id]);
    return rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM tareas WHERE proyecto_id = ?', [id]);
    await pool.query('DELETE FROM proyectos WHERE id = ?', [id]);
    return { success: true };
  }

  static async getUsuarios(proyectoId) {
    const [rows] = await pool.query(`
      SELECT pu.*, u.nombre, u.email, u.avatar
      FROM proyecto_usuarios pu
      LEFT JOIN usuarios u ON pu.usuario_id = u.id
      WHERE pu.proyecto_id = ?
    `, [proyectoId]);
    return rows;
  }

  static async addUsuario(proyectoId, data) {
    const { usuario_id, rol_proyecto } = data;
    const id = uuidv4();

    await pool.query(
      'INSERT INTO proyecto_usuarios (id, proyecto_id, usuario_id, rol_proyecto) VALUES (?, ?, ?, ?)',
      [id, proyectoId, usuario_id, rol_proyecto || 'colaborador']
    );

    const [rows] = await pool.query(`
      SELECT pu.*, u.nombre, u.email, u.avatar
      FROM proyecto_usuarios pu
      LEFT JOIN usuarios u ON pu.usuario_id = u.id
      WHERE pu.id = ?
    `, [id]);

    return rows[0];
  }

  static async removeUsuario(proyectoId, usuarioId) {
    await pool.query(
      'DELETE FROM proyecto_usuarios WHERE proyecto_id = ? AND usuario_id = ?',
      [proyectoId, usuarioId]
    );
    return { success: true };
  }
}

module.exports = Proyecto;

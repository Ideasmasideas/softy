const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Usuario {
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, permisos, avatar, activo, created_at FROM usuarios ORDER BY created_at DESC'
    );
    return rows.map(u => ({
      ...u,
      permisos: u.permisos ? JSON.parse(u.permisos) : []
    }));
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, permisos, avatar, activo, created_at FROM usuarios WHERE id = ?',
      [id]
    );

    if (!rows[0]) return null;

    return {
      ...rows[0],
      permisos: rows[0].permisos ? JSON.parse(rows[0].permisos) : []
    };
  }

  static async create(data) {
    const { nombre, email, password, rol, permisos } = data;
    const id = uuidv4();
    const permisosJson = JSON.stringify(permisos || []);

    await pool.query(
      'INSERT INTO usuarios (id, nombre, email, password, rol, permisos) VALUES (?, ?, ?, ?, ?, ?)',
      [id, nombre, email, password, rol || 'colaborador', permisosJson]
    );

    return await this.findById(id);
  }

  static async update(id, data) {
    const { nombre, email, password, rol, permisos, activo } = data;
    const permisosJson = JSON.stringify(permisos || []);

    if (password) {
      await pool.query(
        'UPDATE usuarios SET nombre=?, email=?, password=?, rol=?, permisos=?, activo=? WHERE id=?',
        [nombre, email, password, rol, permisosJson, activo ? 1 : 0, id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET nombre=?, email=?, rol=?, permisos=?, activo=? WHERE id=?',
        [nombre, email, rol, permisosJson, activo ? 1 : 0, id]
      );
    }

    return await this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM proyecto_usuarios WHERE usuario_id = ?', [id]);
    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    return { success: true };
  }

  static async login(email, password) {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, permisos, avatar FROM usuarios WHERE email = ? AND password = ? AND activo = 1',
      [email, password]
    );

    if (!rows[0]) return null;

    return {
      ...rows[0],
      permisos: rows[0].permisos ? JSON.parse(rows[0].permisos) : []
    };
  }

  static async getProyectos(usuarioId) {
    const [rows] = await pool.query(`
      SELECT p.*, c.nombre as cliente_nombre, c.empresa as cliente_empresa, pu.rol_proyecto
      FROM proyectos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN proyecto_usuarios pu ON p.id = pu.proyecto_id
      WHERE pu.usuario_id = ?
      ORDER BY p.created_at DESC
    `, [usuarioId]);
    return rows;
  }
}

module.exports = Usuario;

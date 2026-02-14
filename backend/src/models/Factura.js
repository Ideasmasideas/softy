const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Factura {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT f.*, c.nombre as cliente_nombre, c.empresa as cliente_empresa, p.nombre as proyecto_nombre
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      LEFT JOIN proyectos p ON f.proyecto_id = p.id
      ORDER BY CAST(f.numero AS UNSIGNED) DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT f.*, c.nombre as cliente_nombre, c.empresa as cliente_empresa,
             c.email as cliente_email, c.direccion as cliente_direccion, c.nif as cliente_nif,
             p.nombre as proyecto_nombre
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      LEFT JOIN proyectos p ON f.proyecto_id = p.id
      WHERE f.id = ?
    `, [id]);

    if (!rows[0]) return null;

    const [lineas] = await pool.query('SELECT * FROM factura_lineas WHERE factura_id = ?', [id]);
    const [configRows] = await pool.query('SELECT * FROM configuracion');

    const config = {};
    configRows.forEach(c => config[c.clave] = c.valor);

    return { ...rows[0], lineas, config };
  }

  static async getNextNumber() {
    const [rows] = await pool.query("SELECT valor FROM configuracion WHERE clave = 'contador_factura'");
    const contador = parseInt(rows[0]?.valor || '260007');
    return String(contador + 1);
  }

  static async create(data) {
    const { cliente_id, proyecto_id, fecha, fecha_vencimiento, lineas, notas, iva = 21, irpf = 15 } = data;
    const id = uuidv4();
    const numero = data.numero || await this.generateInvoiceNumber();
    const estado = data.estado || 'borrador';
    const fecha_envio_programado = this.toDateString(data.fecha_envio_programado) || null;

    const subtotal = lineas.reduce((sum, l) => sum + (l.cantidad * l.precio_unitario), 0);
    const irpfAmount = subtotal * (irpf / 100);
    const ivaAmount = subtotal * (iva / 100);
    const total = subtotal - irpfAmount + ivaAmount;

    await pool.query(
      'INSERT INTO facturas (id, numero, cliente_id, proyecto_id, fecha, fecha_vencimiento, subtotal, iva, irpf, total, notas, estado, fecha_envio_programado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, numero, cliente_id, proyecto_id || null, fecha, fecha_vencimiento || null, subtotal, iva, irpf, total, notas, estado, fecha_envio_programado]
    );

    for (const linea of lineas) {
      await pool.query(
        'INSERT INTO factura_lineas (id, factura_id, concepto, cantidad, precio_unitario, total) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), id, linea.concepto, linea.cantidad, linea.precio_unitario, linea.cantidad * linea.precio_unitario]
      );
    }

    const [rows] = await pool.query('SELECT * FROM facturas WHERE id = ?', [id]);
    return rows[0];
  }

  static toDateString(val) {
    if (!val) return null;
    const str = String(val);
    if (str.includes('T')) return str.split('T')[0];
    return str;
  }

  static async update(id, data) {
    const { lineas, estado } = data;

    if (lineas) {
      const iva = data.iva != null ? Number(data.iva) : 21;
      const irpf = data.irpf != null ? Number(data.irpf) : 0;
      const subtotal = lineas.reduce((sum, l) => sum + (l.cantidad * l.precio_unitario), 0);
      const irpfAmount = subtotal * (irpf / 100);
      const ivaAmount = subtotal * (iva / 100);
      const total = subtotal - irpfAmount + ivaAmount;

      const setClauses = ['subtotal=?', 'iva=?', 'irpf=?', 'total=?'];
      const values = [subtotal, iva, irpf, total];

      if (data.numero !== undefined) { setClauses.push('numero=?'); values.push(data.numero); }
      if (data.cliente_id !== undefined) { setClauses.push('cliente_id=?'); values.push(data.cliente_id || null); }
      if (data.proyecto_id !== undefined) { setClauses.push('proyecto_id=?'); values.push(data.proyecto_id || null); }
      if (data.fecha !== undefined) { setClauses.push('fecha=?'); values.push(this.toDateString(data.fecha)); }
      if (data.fecha_vencimiento !== undefined) { setClauses.push('fecha_vencimiento=?'); values.push(this.toDateString(data.fecha_vencimiento) || null); }
      if (data.notas !== undefined) { setClauses.push('notas=?'); values.push(data.notas); }
      if (data.estado !== undefined) { setClauses.push('estado=?'); values.push(data.estado); }
      if (data.fecha_envio_programado !== undefined) { setClauses.push('fecha_envio_programado=?'); values.push(this.toDateString(data.fecha_envio_programado) || null); }

      values.push(id);
      await pool.query(`UPDATE facturas SET ${setClauses.join(', ')} WHERE id=?`, values);

      await pool.query('DELETE FROM factura_lineas WHERE factura_id = ?', [id]);

      for (const linea of lineas) {
        await pool.query(
          'INSERT INTO factura_lineas (id, factura_id, concepto, cantidad, precio_unitario, total) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, linea.concepto, linea.cantidad, linea.precio_unitario, linea.cantidad * linea.precio_unitario]
        );
      }
    } else {
      const setClauses = [];
      const values = [];
      if (data.estado !== undefined) { setClauses.push('estado=?'); values.push(data.estado); }
      if (data.fecha_envio_programado !== undefined) { setClauses.push('fecha_envio_programado=?'); values.push(this.toDateString(data.fecha_envio_programado) || null); }
      if (setClauses.length > 0) {
        values.push(id);
        await pool.query(`UPDATE facturas SET ${setClauses.join(', ')} WHERE id=?`, values);
      }
    }

    const [rows] = await pool.query('SELECT * FROM facturas WHERE id = ?', [id]);
    return rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM factura_lineas WHERE factura_id = ?', [id]);
    await pool.query('DELETE FROM facturas WHERE id = ?', [id]);
    return { success: true };
  }

  static async findProgramadas(fechaHoy) {
    const [rows] = await pool.query(`
      SELECT f.*, c.email as cliente_email
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      WHERE f.estado = 'programada' AND f.fecha_envio_programado <= ?
    `, [fechaHoy]);
    return rows;
  }

  static async generateInvoiceNumber() {
    const [rows] = await pool.query("SELECT valor FROM configuracion WHERE clave = 'contador_factura'");
    const contador = parseInt(rows[0]?.valor || '260007');
    const nuevoContador = contador + 1;

    await pool.query(
      "INSERT INTO configuracion (clave, valor) VALUES ('contador_factura', ?) ON DUPLICATE KEY UPDATE valor = ?",
      [String(nuevoContador), String(nuevoContador)]
    );

    return String(contador);
  }
}

module.exports = Factura;

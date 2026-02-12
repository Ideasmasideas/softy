const { pool } = require('../config/database');

class Dashboard {
  static async getStats() {
    const [clientesResult] = await pool.query('SELECT COUNT(*) as count FROM clientes');
    const [proyectosResult] = await pool.query('SELECT COUNT(*) as count FROM proyectos');
    const [proyectosActivosResult] = await pool.query("SELECT COUNT(*) as count FROM proyectos WHERE estado IN ('pendiente', 'en_progreso')");
    const [facturadoResult] = await pool.query("SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE estado = 'pagada'");
    const [pendienteCobroResult] = await pool.query("SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE estado IN ('enviada', 'borrador')");
    const [facturasMesResult] = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM facturas
      WHERE DATE_FORMAT(fecha, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `);
    const [horasMesResult] = await pool.query(`
      SELECT COALESCE(SUM(horas), 0) as total
      FROM tareas
      WHERE DATE_FORMAT(fecha, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `);

    const stats = {
      totalClientes: clientesResult[0].count,
      totalProyectos: proyectosResult[0].count,
      proyectosActivos: proyectosActivosResult[0].count,
      totalFacturado: facturadoResult[0].total,
      pendienteCobro: pendienteCobroResult[0].total,
      facturasEsteMes: facturasMesResult[0].total,
      horasEsteMes: horasMesResult[0].total
    };

    const [facturasRecientes] = await pool.query(`
      SELECT f.*, c.nombre as cliente_nombre
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      ORDER BY f.created_at DESC
      LIMIT 5
    `);

    const [facturacionMensual] = await pool.query(`
      SELECT DATE_FORMAT(fecha, '%Y-%m') as mes, SUM(total) as total
      FROM facturas
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(fecha, '%Y-%m')
      ORDER BY mes
    `);

    return { stats, facturasRecientes, facturacionMensual };
  }

  static async getGantt() {
    const [proyectos] = await pool.query(`
      SELECT p.*, c.nombre as cliente_nombre
      FROM proyectos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.estado IN ('pendiente', 'en_progreso')
      ORDER BY p.created_at
    `);

    const ganttData = [];

    for (const proyecto of proyectos) {
      const [tareas] = await pool.query(`
        SELECT * FROM tareas
        WHERE proyecto_id = ? AND fecha_fin IS NOT NULL
        ORDER BY fecha, fecha_fin
      `, [proyecto.id]);

      ganttData.push({
        id: proyecto.id,
        nombre: proyecto.nombre,
        cliente: proyecto.cliente_nombre,
        estado: proyecto.estado,
        tareas: tareas.map(t => ({
          id: t.id,
          titulo: t.titulo,
          responsable: t.responsable,
          estado: t.estado,
          fecha_inicio: t.fecha,
          fecha_fin: t.fecha_fin,
          grupo: t.grupo
        }))
      });
    }

    return ganttData;
  }
}

module.exports = Dashboard;

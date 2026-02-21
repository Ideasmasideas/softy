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

  static async getFiscalData(year) {
    // Facturas por trimestre
    const [facturasTrimestre] = await pool.query(`
      SELECT
        QUARTER(fecha) as trimestre,
        COALESCE(SUM(subtotal), 0) as base_imponible,
        COALESCE(SUM(subtotal * iva / 100), 0) as iva_repercutido,
        COALESCE(SUM(subtotal * irpf / 100), 0) as irpf_retenido
      FROM facturas
      WHERE YEAR(fecha) = ?
      GROUP BY QUARTER(fecha)
      ORDER BY trimestre
    `, [year]);

    // Gastos deducibles por trimestre
    const [gastosTrimestre] = await pool.query(`
      SELECT
        QUARTER(fecha) as trimestre,
        COALESCE(SUM(CASE WHEN deducible = 1 THEN base_imponible ELSE 0 END), 0) as gastos_deducibles,
        COALESCE(SUM(CASE WHEN deducible = 1 THEN base_imponible * iva_soportado / 100 ELSE 0 END), 0) as iva_soportado
      FROM gastos
      WHERE YEAR(fecha) = ?
      GROUP BY QUARTER(fecha)
      ORDER BY trimestre
    `, [year]);

    // Build trimestres
    const trimestres = [];
    for (let q = 1; q <= 4; q++) {
      const fData = facturasTrimestre.find(f => f.trimestre === q) || { base_imponible: 0, iva_repercutido: 0, irpf_retenido: 0 };
      const gData = gastosTrimestre.find(g => g.trimestre === q) || { gastos_deducibles: 0, iva_soportado: 0 };

      const rendimiento_neto = Number(fData.base_imponible) - Number(gData.gastos_deducibles);
      const iva_a_pagar = Number(fData.iva_repercutido) - Number(gData.iva_soportado);
      const irpf_estimado = rendimiento_neto * 0.20;

      trimestres.push({
        trimestre: q,
        base_imponible: Number(fData.base_imponible),
        iva_repercutido: Number(fData.iva_repercutido),
        irpf_retenido: Number(fData.irpf_retenido),
        gastos_deducibles: Number(gData.gastos_deducibles),
        iva_soportado: Number(gData.iva_soportado),
        iva_a_pagar: iva_a_pagar,
        rendimiento_neto: rendimiento_neto,
        irpf_estimado: irpf_estimado > 0 ? irpf_estimado : 0
      });
    }

    // Totales anuales
    const totales = {
      ingresos_brutos: trimestres.reduce((s, t) => s + t.base_imponible, 0),
      gastos_deducibles: trimestres.reduce((s, t) => s + t.gastos_deducibles, 0),
      rendimiento_neto: trimestres.reduce((s, t) => s + t.rendimiento_neto, 0),
      iva_repercutido: trimestres.reduce((s, t) => s + t.iva_repercutido, 0),
      iva_soportado: trimestres.reduce((s, t) => s + t.iva_soportado, 0),
      iva_a_ingresar: trimestres.reduce((s, t) => s + t.iva_a_pagar, 0),
      irpf_retenido: trimestres.reduce((s, t) => s + t.irpf_retenido, 0),
      irpf_estimado: trimestres.reduce((s, t) => s + t.irpf_estimado, 0)
    };

    // Alertas de vencimientos fiscales
    const hoy = new Date();
    const fechasModelo303 = [
      new Date(year, 0, 20), // 20 enero (T4 anterior)
      new Date(year, 3, 20), // 20 abril (T1)
      new Date(year, 6, 20), // 20 julio (T2)
      new Date(year, 9, 20)  // 20 octubre (T3)
    ];
    const alertas = [];
    const trimestreLabels = ['T4 ' + (year - 1), 'T1 ' + year, 'T2 ' + year, 'T3 ' + year];

    fechasModelo303.forEach((fecha, i) => {
      const diffDias = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
      if (diffDias > -30 && diffDias <= 30) {
        alertas.push({
          modelo: 'Modelo 303 / 130',
          trimestre: trimestreLabels[i],
          fecha: fecha.toISOString().split('T')[0],
          dias_restantes: diffDias,
          estado: diffDias < 0 ? 'vencido' : diffDias <= 7 ? 'urgente' : diffDias <= 15 ? 'proximo' : 'ok'
        });
      }
    });

    return { trimestres, totales, alertas };
  }
}

module.exports = Dashboard;

const { pool } = require('./database');

async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id VARCHAR(36) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telefono VARCHAR(50),
        empresa VARCHAR(255),
        direccion TEXT,
        nif VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id VARCHAR(36) PRIMARY KEY,
        cliente_id VARCHAR(36) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        tipo ENUM('proyecto', 'horas') DEFAULT 'proyecto',
        precio_hora DECIMAL(10,2) DEFAULT 0,
        presupuesto DECIMAL(10,2) DEFAULT 0,
        horas_estimadas DECIMAL(10,2) DEFAULT 0,
        horas_consumidas DECIMAL(10,2) DEFAULT 0,
        estado ENUM('pendiente', 'en_progreso', 'completado', 'facturado') DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tareas (
        id VARCHAR(36) PRIMARY KEY,
        proyecto_id VARCHAR(36) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        horas DECIMAL(10,2) DEFAULT 0,
        completada TINYINT(1) DEFAULT 0,
        fecha DATE,
        grupo VARCHAR(255),
        responsable VARCHAR(255),
        estado VARCHAR(50) DEFAULT 'pendiente',
        fecha_fin DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS facturas (
        id VARCHAR(36) PRIMARY KEY,
        numero VARCHAR(50) NOT NULL UNIQUE,
        cliente_id VARCHAR(36) NOT NULL,
        proyecto_id VARCHAR(36),
        fecha DATE NOT NULL,
        fecha_vencimiento DATE,
        subtotal DECIMAL(10,2) NOT NULL,
        iva DECIMAL(5,2) DEFAULT 21,
        irpf DECIMAL(5,2) DEFAULT 15,
        total DECIMAL(10,2) NOT NULL,
        estado ENUM('borrador', 'enviada', 'pagada', 'vencida') DEFAULT 'borrador',
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS factura_lineas (
        id VARCHAR(36) PRIMARY KEY,
        factura_id VARCHAR(36) NOT NULL,
        concepto VARCHAR(255) NOT NULL,
        cantidad DECIMAL(10,2) DEFAULT 1,
        precio_unitario DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (factura_id) REFERENCES facturas(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS facturas_recurrentes (
        id VARCHAR(36) PRIMARY KEY,
        cliente_id VARCHAR(36) NOT NULL,
        proyecto_id VARCHAR(36),
        dia_mes INT NOT NULL,
        iva DECIMAL(5,2) DEFAULT 21,
        irpf DECIMAL(5,2) DEFAULT 15,
        notas TEXT,
        activa TINYINT(1) DEFAULT 1,
        ultima_generacion DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS factura_recurrente_lineas (
        id VARCHAR(36) PRIMARY KEY,
        factura_recurrente_id VARCHAR(36) NOT NULL,
        concepto VARCHAR(255) NOT NULL,
        cantidad DECIMAL(10,2) DEFAULT 1,
        precio_unitario DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (factura_recurrente_id) REFERENCES facturas_recurrentes(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(100) PRIMARY KEY,
        valor TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(36) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'manager', 'colaborador') DEFAULT 'colaborador',
        permisos TEXT,
        avatar VARCHAR(255),
        activo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS proyecto_usuarios (
        id VARCHAR(36) PRIMARY KEY,
        proyecto_id VARCHAR(36) NOT NULL,
        usuario_id VARCHAR(36) NOT NULL,
        rol_proyecto ENUM('propietario', 'colaborador', 'observador') DEFAULT 'colaborador',
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_proyecto_usuario (proyecto_id, usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ Database tables created successfully');

    // Insert default configuration
    await pool.query(`
      INSERT IGNORE INTO configuracion (clave, valor) VALUES
      ('empresa_nombre', 'José Francisco Manzano Hartl'),
      ('empresa_email', 'info@ideasmasideas.com'),
      ('empresa_direccion', 'Rambla Marina 260, 7º,2º\nCP: 08907 Hospitallet de Llobregat, Barcelona'),
      ('empresa_nif', 'ES 54245681C'),
      ('contador_factura', '260007'),
      ('empresa_iban', 'ES22 1465 01 20351742959555'),
      ('empresa_bic', 'INGDESMMXXX')
    `);

    console.log('✓ Default configuration inserted');

    // Create default admin user
    const adminPermisos = JSON.stringify(['clientes', 'proyectos', 'facturas', 'tareas', 'usuarios', 'configuracion', 'gantt']);
    await pool.query(`
      INSERT IGNORE INTO usuarios (id, nombre, email, password, rol, permisos)
      VALUES ('admin-default', 'Administrador', 'admin@ideasmasideas.com', 'admin123', 'admin', ?)
    `, [adminPermisos]);

    console.log('✓ Default admin user created (email: admin@ideasmasideas.com, password: admin123)');
    console.log('✓ Database initialization completed successfully');

  } catch (error) {
    console.error('✗ Error initializing database:', error.message);
    throw error;
  }
}

module.exports = { initializeDatabase };

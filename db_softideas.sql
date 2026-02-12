-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Feb 12, 2026 at 06:01 PM
-- Server version: 5.7.39
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_softideas`
--

-- --------------------------------------------------------

--
-- Table structure for table `clientes`
--

CREATE TABLE `clientes` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `empresa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `nif` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clientes`
--

INSERT INTO `clientes` (`id`, `nombre`, `email`, `telefono`, `empresa`, `direccion`, `nif`, `created_at`) VALUES
('ee444dea-0f85-4463-b02b-3a861b58d799', 'Francisco Zaragoza Tost', 'jose.manzano@gmail.com', '', 'Xprint', 'Gran Via Corts Catalanes 672\n08010 Barcelona.', '35113709T', '2026-01-31 19:26:58');

-- --------------------------------------------------------

--
-- Table structure for table `configuracion`
--

CREATE TABLE `configuracion` (
  `clave` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `configuracion`
--

INSERT INTO `configuracion` (`clave`, `valor`) VALUES
('contador_factura', '260017'),
('empresa_bic', 'INGDESMMXXX'),
('empresa_direccion', 'Rambla Marina 260, 7º,2º\nCP: 08907 \nHospitallet de Llobregat, Barcelona'),
('empresa_email', 'jose@ideasmasideas.com'),
('empresa_iban', 'ES22 1465 01 20351742959555'),
('empresa_nif', 'ES 54245681C'),
('empresa_nombre', 'José Francisco Manzano Hartl');

-- --------------------------------------------------------

--
-- Table structure for table `facturas`
--

CREATE TABLE `facturas` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proyecto_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha` date NOT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `iva` decimal(5,2) DEFAULT '21.00',
  `irpf` decimal(5,2) DEFAULT '15.00',
  `total` decimal(10,2) NOT NULL,
  `estado` enum('borrador','enviada','pagada','vencida') COLLATE utf8mb4_unicode_ci DEFAULT 'borrador',
  `notas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `facturas_recurrentes`
--

CREATE TABLE `facturas_recurrentes` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proyecto_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_mes` int(11) NOT NULL,
  `iva` decimal(5,2) DEFAULT '21.00',
  `irpf` decimal(5,2) DEFAULT '15.00',
  `notas` text COLLATE utf8mb4_unicode_ci,
  `activa` tinyint(1) DEFAULT '1',
  `ultima_generacion` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `factura_lineas`
--

CREATE TABLE `factura_lineas` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `factura_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `concepto` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` decimal(10,2) DEFAULT '1.00',
  `precio_unitario` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `factura_recurrente_lineas`
--

CREATE TABLE `factura_recurrente_lineas` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `factura_recurrente_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `concepto` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` decimal(10,2) DEFAULT '1.00',
  `precio_unitario` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proyectos`
--

CREATE TABLE `proyectos` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `tipo` enum('proyecto','horas') COLLATE utf8mb4_unicode_ci DEFAULT 'proyecto',
  `precio_hora` decimal(10,2) DEFAULT '0.00',
  `presupuesto` decimal(10,2) DEFAULT '0.00',
  `horas_estimadas` decimal(10,2) DEFAULT '0.00',
  `horas_consumidas` decimal(10,2) DEFAULT '0.00',
  `estado` enum('pendiente','en_progreso','completado','facturado') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `proyectos`
--

INSERT INTO `proyectos` (`id`, `cliente_id`, `nombre`, `descripcion`, `tipo`, `precio_hora`, `presupuesto`, `horas_estimadas`, `horas_consumidas`, `estado`, `created_at`) VALUES
('4eb6a5bd-25e1-4454-952f-dbd4d821381e', 'ee444dea-0f85-4463-b02b-3a861b58d799', 'Pagina web', '', 'proyecto', '0.00', '1500.00', '0.00', '0.00', 'pendiente', '2026-02-07 08:12:22');

-- --------------------------------------------------------

--
-- Table structure for table `proyecto_usuarios`
--

CREATE TABLE `proyecto_usuarios` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proyecto_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol_proyecto` enum('propietario','colaborador','observador') COLLATE utf8mb4_unicode_ci DEFAULT 'colaborador'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tareas`
--

CREATE TABLE `tareas` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `proyecto_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `horas` decimal(10,2) DEFAULT '0.00',
  `completada` tinyint(1) DEFAULT '0',
  `fecha` date DEFAULT NULL,
  `grupo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `responsable` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `fecha_fin` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tareas`
--

INSERT INTO `tareas` (`id`, `proyecto_id`, `titulo`, `descripcion`, `horas`, `completada`, `fecha`, `grupo`, `responsable`, `estado`, `fecha_fin`, `created_at`) VALUES
('6d9083ba-19d1-435a-bbf1-1c201d88b84c', '4eb6a5bd-25e1-4454-952f-dbd4d821381e', 'Diseñar Figma', NULL, '0.00', 1, '2026-02-06', NULL, NULL, 'completada', '2026-02-14', '2026-02-07 08:12:58');

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('admin','manager','colaborador') COLLATE utf8mb4_unicode_ci DEFAULT 'colaborador',
  `permisos` text COLLATE utf8mb4_unicode_ci,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `permisos`, `avatar`, `activo`, `created_at`) VALUES
('admin-default', 'Administrador', 'admin@ideasmasideas.com', 'admin123', 'admin', '[\"clientes\",\"proyectos\",\"facturas\",\"tareas\",\"usuarios\",\"configuracion\",\"gantt\"]', NULL, 1, '2026-01-31 19:24:22');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`clave`);

--
-- Indexes for table `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `proyecto_id` (`proyecto_id`);

--
-- Indexes for table `facturas_recurrentes`
--
ALTER TABLE `facturas_recurrentes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- Indexes for table `factura_lineas`
--
ALTER TABLE `factura_lineas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `factura_id` (`factura_id`);

--
-- Indexes for table `factura_recurrente_lineas`
--
ALTER TABLE `factura_recurrente_lineas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `factura_recurrente_id` (`factura_recurrente_id`);

--
-- Indexes for table `proyectos`
--
ALTER TABLE `proyectos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- Indexes for table `proyecto_usuarios`
--
ALTER TABLE `proyecto_usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_proyecto_usuario` (`proyecto_id`,`usuario_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indexes for table `tareas`
--
ALTER TABLE `tareas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proyecto_id` (`proyecto_id`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `facturas`
--
ALTER TABLE `facturas`
  ADD CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  ADD CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`id`);

--
-- Constraints for table `facturas_recurrentes`
--
ALTER TABLE `facturas_recurrentes`
  ADD CONSTRAINT `facturas_recurrentes_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`);

--
-- Constraints for table `factura_lineas`
--
ALTER TABLE `factura_lineas`
  ADD CONSTRAINT `factura_lineas_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`);

--
-- Constraints for table `factura_recurrente_lineas`
--
ALTER TABLE `factura_recurrente_lineas`
  ADD CONSTRAINT `factura_recurrente_lineas_ibfk_1` FOREIGN KEY (`factura_recurrente_id`) REFERENCES `facturas_recurrentes` (`id`);

--
-- Constraints for table `proyectos`
--
ALTER TABLE `proyectos`
  ADD CONSTRAINT `proyectos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`);

--
-- Constraints for table `proyecto_usuarios`
--
ALTER TABLE `proyecto_usuarios`
  ADD CONSTRAINT `proyecto_usuarios_ibfk_1` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proyecto_usuarios_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tareas`
--
ALTER TABLE `tareas`
  ADD CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

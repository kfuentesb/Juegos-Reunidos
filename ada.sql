-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 23, 2026 at 08:34 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ada`
--

-- --------------------------------------------------------

--
-- Table structure for table `alumnos`
--

CREATE TABLE `alumnos` (
  `idAlumno` int(11) NOT NULL,
  `alumno` varchar(80) NOT NULL,
  `puntuacion` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `alumnos`
--

INSERT INTO `alumnos` (`idAlumno`, `alumno`, `puntuacion`) VALUES
(1, 'Ana García', 85),
(2, 'Luis Pérez', 40),
(3, 'Marta López', 78),
(4, 'Carlos Fernández', 12),
(5, 'Sofía Ruiz', 95),
(6, 'Kevin', 200),
(8, 'cris', 0),
(9, 'prueba', 0),
(10, 'Kevinchu', 77),
(11, 'developer', 9);

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `idUsuario` int(11) NOT NULL,
  `usuario` varchar(80) NOT NULL,
  `email` varchar(80) NOT NULL,
  `telefono` char(9) NOT NULL,
  `fecha` date NOT NULL,
  `genero` enum('masculino','femenino','no-decirlo') NOT NULL DEFAULT 'no-decirlo',
  `rol` enum('a-diario','ocasionalmente','semanalmente') NOT NULL,
  `juego_estrategia` tinyint(1) NOT NULL DEFAULT 0,
  `juego_accion` tinyint(1) NOT NULL DEFAULT 0,
  `juego_rpg` tinyint(1) NOT NULL DEFAULT 0,
  `juego_puzzle` tinyint(1) NOT NULL DEFAULT 0,
  `juego_carreras` tinyint(1) NOT NULL DEFAULT 0,
  `password` varchar(80) NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `tipo` enum('admin','jugador') NOT NULL DEFAULT 'jugador'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`idUsuario`, `usuario`, `email`, `telefono`, `fecha`, `genero`, `rol`, `juego_estrategia`, `juego_accion`, `juego_rpg`, `juego_puzzle`, `juego_carreras`, `password`, `fecha_registro`, `tipo`) VALUES
(1, 'Kevin', 'kev@iescamas.es', '987654321', '2026-02-10', 'no-decirlo', 'a-diario', 1, 1, 0, 0, 0, 'qewr1234R#', '2026-02-11 22:23:41', 'admin'),
(5, 'Kevinchu', 'kevinchu@iescamas.es', '123498765', '2021-12-15', 'femenino', 'semanalmente', 1, 1, 1, 0, 0, 'heladoGRATIS1!', '2026-02-11 23:00:13', 'jugador'),
(6, 'developer', 'dev@centro.es', '987654321', '2026-02-09', 'masculino', 'a-diario', 1, 1, 1, 0, 0, 'developer123T#', '2026-02-19 12:59:52', 'jugador'),
(12, 'Kevinadd', 'kevinadd@add.es', '659874123', '2026-03-01', 'no-decirlo', 'a-diario', 0, 0, 1, 0, 1, 'Kevinadd1234#', '2026-03-03 14:40:31', 'admin');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alumnos`
--
ALTER TABLE `alumnos`
  ADD PRIMARY KEY (`idAlumno`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`idUsuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alumnos`
--
ALTER TABLE `alumnos`
  MODIFY `idAlumno` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `idUsuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

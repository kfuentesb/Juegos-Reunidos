<?php
// Configura la cabecera HTTP para indicar que la respuesta es JSON en UTF-8
header('Content-Type: application/json; charset=utf-8');

// ================================
// 1. Conexión a la base de datos
// ================================
$conn = new mysqli("localhost", "root", "", "ada");

// Si hay error de conexión, devolver un array vacío y salir
if ($conn->connect_error) {
  echo json_encode([]);
  exit;
}

// ======================================================
// 2. Prepara la consulta SQL para obtener todos los datos de usuarios
// ======================================================

// Selecciona todos los datos de usuarios y puntuación de alumnos.
$sql = "SELECT 
          u.usuario,
          u.email,
          u.telefono,
          u.fecha,
          u.genero,
          u.rol,
          u.juego_estrategia,
          u.juego_accion,
          u.juego_rpg,
          u.juego_puzzle,
          u.juego_carreras,
          u.tipo,
          u.password,
          COALESCE(a.puntuacion, 0) AS puntuacion
        FROM usuarios u
        LEFT JOIN alumnos a ON u.usuario = a.alumno
        ORDER BY u.usuario ASC";

// Ejecuta la consulta y almacena el resultado
$result = $conn->query($sql);

// ==============================
// 3. Construye el array de salida
// ==============================
$usuarios = [];

// Recorre cada fila de la consulta y la agrega al array
while ($fila = $result->fetch_assoc()) {
  $usuarios[] = [
    "usuario"           => $fila["usuario"],
    "email"             => $fila["email"],
    "telefono"          => $fila["telefono"],
    "fecha"             => $fila["fecha"],
    "genero"            => $fila["genero"],
    "rol"               => $fila["rol"],
    "juego_estrategia"  => (int)$fila["juego_estrategia"],
    "juego_accion"      => (int)$fila["juego_accion"],
    "juego_rpg"         => (int)$fila["juego_rpg"],
    "juego_puzzle"      => (int)$fila["juego_puzzle"],
    "juego_carreras"    => (int)$fila["juego_carreras"],
    "tipo"              => $fila["tipo"],
    "puntuacion"        => (int)$fila["puntuacion"]
  ];
}

// =====================================
// 4. Devuelve los datos en formato JSON
// =====================================
echo json_encode($usuarios);
$conn->close();

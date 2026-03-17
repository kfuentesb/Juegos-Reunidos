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
// 2. Prepara la consulta SQL para unir usuarios/alumnos
// ======================================================

// Selecciona datos de usuarios y puntuación de alumnos.
// LEFT JOIN asegura que todos los usuarios aparecen aunque no sean alumnos.
// COALESCE garantiza que si no hay puntuación (NULL), devuelve 0.
$sql = "SELECT usuarios.usuario,
               usuarios.email,
               usuarios.rol,
               usuarios.tipo,
               alumnos.idAlumno,
               COALESCE(alumnos.puntuacion, 0) AS puntuacion
        FROM usuarios
        LEFT JOIN alumnos ON usuarios.usuario = alumnos.alumno
        ORDER BY usuarios.usuario ASC";

// Ejecuta la consulta y almacena el resultado
$result = $conn->query($sql);

// ==============================
// 3. Construye el array de salida
// ==============================
$usuarios = []; // Array que contendrá todos los usuarios con su info

// Recorre cada fila de la consulta y la agrega al array
while ($fila = $result->fetch_assoc()) {
  $usuarios[] = [
    "idAlumno"   => $fila["idAlumno"] !== null ? (int)$fila["idAlumno"] : null, // Si no hay alumno, null
    "usuario"    => $fila["usuario"],                                           // Nombre de usuario
    "email"      => $fila["email"],                                             // Email del usuario
    "rol"        => $fila["rol"],                                               // Rol/frecuencia, ej: 'a-diario'
    "tipo"       => $fila["tipo"],                                              // Tipo, ej: 'admin' o 'jugador'
    "puntuacion" => (int)$fila["puntuacion"]                                    // Siempre int; 0 si no hay
  ];
}

// =====================================
// 4. Devuelve los datos en formato JSON
// =====================================
echo json_encode($usuarios); // Salida para el frontend (JS, etc)
$conn->close(); // Cierra la conexión a la base de datos
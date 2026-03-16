<?php
header('Content-Type: application/json; charset=utf-8');

$conn = new mysqli("localhost", "root", "", "ada");
if ($conn->connect_error) {
  echo json_encode([]);
  exit;
}

$sql = "SELECT usuarios.usuario,
               usuarios.email,
               usuarios.rol,
               usuarios.tipo,
               alumnos.idAlumno,
               COALESCE(alumnos.puntuacion, 0) AS puntuacion
        FROM usuarios
        LEFT JOIN alumnos ON usuarios.usuario = alumnos.alumno
        ORDER BY usuarios.usuario ASC";

$result = $conn->query($sql);

$usuarios = [];
while ($fila = $result->fetch_assoc()) {
  $usuarios[] = [
    "idAlumno"   => $fila["idAlumno"] !== null ? (int)$fila["idAlumno"] : null,
    "usuario"    => $fila["usuario"],
    "email"      => $fila["email"],
    "rol"        => $fila["rol"],
    "tipo"       => $fila["tipo"],
    "puntuacion" => (int)$fila["puntuacion"]
  ];
}

echo json_encode($usuarios);
$conn->close();
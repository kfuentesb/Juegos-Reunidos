<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "ada");
if ($conn->connect_error) {
  echo json_encode([]);
  exit;
}

$sql = "SELECT usuarios.usuario, usuarios.email, usuarios.rol, usuarios.tipo, alumnos.puntuacion
        FROM usuarios
        LEFT JOIN alumnos ON usuarios.usuario = alumnos.alumno";
$result = $conn->query($sql);

$usuarios = [];
while ($fila = $result->fetch_assoc()) {
  $usuarios[] = [
    "usuario" => $fila["usuario"],
    "email" => $fila["email"],
    "rol" => $fila["rol"],     // frecuencia
    "tipo" => $fila["tipo"],   // admin/jugador
    "puntuacion" => $fila["puntuacion"]
  ];
}
echo json_encode($usuarios);
$conn->close();
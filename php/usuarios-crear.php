<?php
header('Content-Type: application/json');

$usuario = $_POST['usuario'] ?? '';
$email = $_POST['email'] ?? '';
$rol = $_POST['rol'] ?? '';        // frecuencia
$tipo = $_POST['tipo'] ?? '';      // admin/jugador
$password = $_POST['password'] ?? '';
$puntuacion = isset($_POST['puntuacion']) ? (int)$_POST['puntuacion'] : 0;

if ($usuario === '' || $email === '' || $rol === '' || $tipo === '' || $password === '') {
  echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
  exit;
}

$conn = new mysqli("localhost", "root", "", "ada");
if ($conn->connect_error) {
  echo json_encode(['success' => false, 'message' => 'Error conexión DB']);
  exit;
}

$conn->begin_transaction();

try {
  $stmt1 = $conn->prepare("INSERT INTO usuarios (idUsuario, usuario, email, telefono, fecha, genero, rol, tipo, juego_estrategia, juego_accion, juego_rpg, juego_puzzle, juego_carreras, password, fecha_registro)
                           VALUES (NULL, ?, ?, '', '', '', ?, ?, 0, 0, 0, 0, 0, ?, NOW())");
  $stmt1->bind_param("sssss", $usuario, $email, $rol, $tipo, $password);
  $stmt1->execute();

  $stmt2 = $conn->prepare("INSERT INTO alumnos (idAlumno, alumno, puntuacion) VALUES (NULL, ?, ?)");
  $stmt2->bind_param("si", $usuario, $puntuacion);
  $stmt2->execute();

  $conn->commit();
  echo json_encode(['success' => true]);
} catch (Exception $e) {
  $conn->rollback();
  echo json_encode(['success' => false, 'message' => 'Error al crear usuario']);
}

$conn->close();
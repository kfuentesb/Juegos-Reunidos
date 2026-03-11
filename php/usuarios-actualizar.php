<?php
header('Content-Type: application/json');

$usuario = $_POST['usuario'] ?? '';
$email = $_POST['email'] ?? '';
$rol = $_POST['rol'] ?? '';
$tipo = $_POST['tipo'] ?? '';
$puntuacion = isset($_POST['puntuacion']) ? (int)$_POST['puntuacion'] : 0;

if ($usuario === '' || $email === '' || $rol === '' || $tipo === '') {
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
  $stmt1 = $conn->prepare("UPDATE usuarios SET email = ?, rol = ?, tipo = ? WHERE usuario = ?");
  $stmt1->bind_param("ssss", $email, $rol, $tipo, $usuario);
  $stmt1->execute();

  $stmt2 = $conn->prepare("UPDATE alumnos SET puntuacion = ? WHERE alumno = ?");
  $stmt2->bind_param("is", $puntuacion, $usuario);
  $stmt2->execute();

  $conn->commit();
  echo json_encode(['success' => true]);
} catch (Exception $e) {
  $conn->rollback();
  echo json_encode(['success' => false, 'message' => 'Error al actualizar']);
}

$conn->close();
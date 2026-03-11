<?php
header('Content-Type: application/json');

$usuario = $_POST['usuario'] ?? '';
if (!$usuario) {
  echo json_encode(['success' => false, 'message' => 'Usuario inválido']);
  exit;
}

$conn = new mysqli("localhost", "root", "", "ada");
if ($conn->connect_error) {
  echo json_encode(['success' => false, 'message' => 'Error conexión DB']);
  exit;
}

$conn->begin_transaction();

try {
  $stmt1 = $conn->prepare("DELETE FROM alumnos WHERE alumno = ?");
  $stmt1->bind_param("s", $usuario);
  $stmt1->execute();

  $stmt2 = $conn->prepare("DELETE FROM usuarios WHERE usuario = ?");
  $stmt2->bind_param("s", $usuario);
  $stmt2->execute();

  $conn->commit();
  echo json_encode(['success' => true]);
} catch (Exception $e) {
  $conn->rollback();
  echo json_encode(['success' => false, 'message' => 'Error eliminando']);
}

$conn->close();
<?php
header('Content-Type: application/json; charset=utf-8');

$usuario = $_POST['usuario'] ?? '';

if (!$usuario) {
  echo json_encode([
    'success' => false, 
    'message' => 'Usuario inválido'
  ]);
  exit;
}

$conn = new mysqli("localhost", "root", "", "ada");
if ($conn->connect_error) {
  echo json_encode([
    'success' => false, 
    'message' => 'Error conexión DB'
  ]);
  exit;
}

$conn->begin_transaction();

try {
  // Primero eliminar de alumnos (tabla hija)
  $stmt1 = $conn->prepare("DELETE FROM alumnos WHERE alumno = ?");
  $stmt1->bind_param("s", $usuario);
  $stmt1->execute();
  $stmt1->close();

  // Luego eliminar de usuarios (tabla padre)
  $stmt2 = $conn->prepare("DELETE FROM usuarios WHERE usuario = ?");
  $stmt2->bind_param("s", $usuario);
  $stmt2->execute();
  $stmt2->close();

  $conn->commit();
  
  echo json_encode([
    'success' => true,
    'message' => 'Usuario eliminado correctamente'
  ]);

} catch (Exception $e) {
  $conn->rollback();
  echo json_encode([
    'success' => false, 
    'message' => 'Error eliminando: ' . $e->getMessage()
  ]);
}

$conn->close();

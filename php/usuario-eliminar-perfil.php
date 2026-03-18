<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Verificar que el usuario está logueado
if (!isset($_SESSION['user'])) {
  echo json_encode([
    'success' => false,
    'message' => 'No hay sesión activa'
  ]);
  exit;
}

$usuario  = $_POST['usuario'] ?? '';
$password = $_POST['password'] ?? '';

if (!$usuario || !$password) {
  echo json_encode([
    'success' => false,
    'message' => 'Usuario y contraseña son obligatorios'
  ]);
  exit;
}

// Solo puede eliminar su propia cuenta
$sessionUser = $_SESSION['user']['user'];

if ($usuario !== $sessionUser) {
  echo json_encode([
    'success' => false,
    'message' => 'No tienes permiso para eliminar esta cuenta'
  ]);
  exit;
}

// Conexión a la base de datos
$conn = new mysqli("localhost", "root", "", "ada");
if ($conn->connect_error) {
  echo json_encode([
    'success' => false,
    'message' => 'Error conexión DB'
  ]);
  exit;
}

// Verificar la contraseña antes de eliminar
$stmt = $conn->prepare("SELECT password FROM usuarios WHERE usuario = ? LIMIT 1");
$stmt->bind_param("s", $usuario);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
  $stmt->close();
  $conn->close();
  echo json_encode([
    'success' => false,
    'message' => 'Usuario no encontrado'
  ]);
  exit;
}

$row = $result->fetch_assoc();
$stmt->close();

// Verificar contraseña
if ($row['password'] !== $password) {
  $conn->close();
  echo json_encode([
    'success' => false,
    'message' => 'Contraseña incorrecta'
  ]);
  exit;
}

// Iniciar transacción para eliminar
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

  // Confirmar transacción
  $conn->commit();

  // Destruir la sesión
  session_unset();
  session_destroy();

  echo json_encode([
    'success' => true,
    'message' => 'Cuenta eliminada correctamente'
  ]);

} catch (Exception $e) {
  $conn->rollback();
  echo json_encode([
    'success' => false,
    'message' => 'Error eliminando cuenta: ' . $e->getMessage()
  ]);
}

$conn->close();

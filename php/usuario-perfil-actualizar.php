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

// Recoger datos enviados por POST
$usuario          = $_POST['usuario'] ?? '';
$email            = $_POST['email'] ?? '';
$telefono         = $_POST['telefono'] ?? '';
$fecha            = $_POST['fecha'] ?? '';
$genero           = $_POST['genero'] ?? '';
$rol              = $_POST['rol'] ?? '';
$password         = $_POST['password'] ?? ''; // Puede estar vacío (no cambiar)

// Intereses (checkboxes)
$estrategia = isset($_POST['juego_estrategia']) ? (int)$_POST['juego_estrategia'] : 0;
$accion     = isset($_POST['juego_accion']) ? (int)$_POST['juego_accion'] : 0;
$rpg        = isset($_POST['juego_rpg']) ? (int)$_POST['juego_rpg'] : 0;
$puzzle     = isset($_POST['juego_puzzle']) ? (int)$_POST['juego_puzzle'] : 0;
$carreras   = isset($_POST['juego_carreras']) ? (int)$_POST['juego_carreras'] : 0;

// Validación
if ($usuario === '' || $email === '' || $telefono === '' || $fecha === '' || $genero === '' || $rol === '') {
  echo json_encode([
    'success' => false,
    'message' => 'Datos incompletos'
  ]);
  exit;
}

// Solo puede editar su propio perfil (o un admin puede editar cualquiera)
$sessionUser = $_SESSION['user']['user'];
$sessionTipo = $_SESSION['user']['tipo'] ?? 'jugador';

if ($usuario !== $sessionUser && $sessionTipo !== 'admin') {
  echo json_encode([
    'success' => false,
    'message' => 'No tienes permiso para editar este perfil'
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

// Iniciar transacción
$conn->begin_transaction();

try {
  // UPDATE en tabla usuarios
  if ($password !== '') {
    // Si se proporcionó nueva contraseña, actualizarla también
    $sql = "UPDATE usuarios SET 
              email = ?, 
              telefono = ?, 
              fecha = ?, 
              genero = ?, 
              rol = ?, 
              juego_estrategia = ?, 
              juego_accion = ?, 
              juego_rpg = ?, 
              juego_puzzle = ?, 
              juego_carreras = ?,
              password = ?
            WHERE usuario = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
      "ssssiiiiisss",
      $email,
      $telefono,
      $fecha,
      $genero,
      $rol,
      $estrategia,
      $accion,
      $rpg,
      $puzzle,
      $carreras,
      $password,
      $usuario
    );
  } else {
    // Sin cambio de contraseña
    $sql = "UPDATE usuarios SET 
              email = ?, 
              telefono = ?, 
              fecha = ?, 
              genero = ?, 
              rol = ?, 
              juego_estrategia = ?, 
              juego_accion = ?, 
              juego_rpg = ?, 
              juego_puzzle = ?, 
              juego_carreras = ?
            WHERE usuario = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
      "ssssiiiiiss",
      $email,
      $telefono,
      $fecha,
      $genero,
      $rol,
      $estrategia,
      $accion,
      $rpg,
      $puzzle,
      $carreras,
      $usuario
    );
  }

  if (!$stmt->execute()) {
    throw new Exception("Error al actualizar perfil: " . $stmt->error);
  }
  $stmt->close();

  // Confirmar transacción
  $conn->commit();

  // Actualizar datos de sesión si es el usuario actual
  if ($usuario === $sessionUser) {
    $_SESSION['user']['email'] = $email;
    $_SESSION['user']['rol'] = $rol;
  }

  echo json_encode([
    'success' => true,
    'message' => 'Perfil actualizado correctamente'
  ]);

} catch (Exception $e) {
  $conn->rollback();
  echo json_encode([
    'success' => false,
    'message' => $e->getMessage()
  ]);
}

$conn->close();

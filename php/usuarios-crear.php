<?php
header('Content-Type: application/json; charset=utf-8');

// Recoger datos enviados por POST
$usuario    = $_POST['usuario'] ?? '';
$email      = $_POST['email'] ?? '';
$telefono   = $_POST['telefono'] ?? '';
$fecha      = $_POST['fecha'] ?? '';
$genero     = $_POST['genero'] ?? '';
$rol        = $_POST['rol'] ?? '';
$tipo       = $_POST['tipo'] ?? 'jugador';
$password   = $_POST['password'] ?? '';
$puntuacion = isset($_POST['puntuacion']) ? (int)$_POST['puntuacion'] : 0;

// Intereses (checkboxes)
$estrategia = isset($_POST['juego_estrategia']) ? (int)$_POST['juego_estrategia'] : 0;
$accion     = isset($_POST['juego_accion']) ? (int)$_POST['juego_accion'] : 0;
$rpg        = isset($_POST['juego_rpg']) ? (int)$_POST['juego_rpg'] : 0;
$puzzle     = isset($_POST['juego_puzzle']) ? (int)$_POST['juego_puzzle'] : 0;
$carreras   = isset($_POST['juego_carreras']) ? (int)$_POST['juego_carreras'] : 0;

// Validación mínima
if ($usuario === '' || $email === '' || $telefono === '' || $fecha === '' || $genero === '' || $rol === '' || $password === '') {
  echo json_encode([
    "success" => false,
    "message" => "Faltan campos obligatorios"
  ]);
  exit;
}

// Conexión a la base de datos
$conn = new mysqli("localhost", "root", "", "ada");
if ($conn->connect_error) {
  echo json_encode([
    "success" => false,
    "message" => "Error conexión DB"
  ]);
  exit;
}

// Verificar si el usuario ya existe
$stmtCheck = $conn->prepare("SELECT usuario FROM usuarios WHERE usuario = ? LIMIT 1");
$stmtCheck->bind_param("s", $usuario);
$stmtCheck->execute();
$resultCheck = $stmtCheck->get_result();
if ($resultCheck->num_rows > 0) {
  $stmtCheck->close();
  $conn->close();
  echo json_encode([
    "success" => false,
    "message" => "El usuario ya existe"
  ]);
  exit;
}
$stmtCheck->close();

// Iniciamos una transacción
$conn->begin_transaction();

try {
  // INSERT en tabla usuarios
  $sql = "INSERT INTO usuarios
    (idUsuario, usuario, email, telefono, fecha, genero, rol, 
     juego_estrategia, juego_accion, juego_rpg, juego_puzzle, juego_carreras, 
     password, tipo, fecha_registro)
    VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

  $stmt = $conn->prepare($sql);
  $stmt->bind_param(
    "ssssssiiiiiss",
    $usuario,
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
    $tipo
  );

  if (!$stmt->execute()) {
    throw new Exception("Error al insertar en usuarios: " . $stmt->error);
  }
  $stmt->close();

  // INSERT en tabla alumnos
  $sql2 = "INSERT INTO alumnos (idAlumno, alumno, puntuacion) VALUES (NULL, ?, ?)";
  $stmt2 = $conn->prepare($sql2);
  $stmt2->bind_param("si", $usuario, $puntuacion);

  if (!$stmt2->execute()) {
    throw new Exception("Error al insertar en alumnos: " . $stmt2->error);
  }
  $stmt2->close();

  // Confirmar la transacción
  $conn->commit();

  echo json_encode([
    "success" => true,
    "message" => "Usuario creado correctamente"
  ]);

} catch (Exception $e) {
  $conn->rollback();
  echo json_encode([
    "success" => false,
    "message" => $e->getMessage()
  ]);
}

$conn->close();

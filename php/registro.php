<?php
header('Content-Type: application/json; charset=utf-8');

// Recoger datos
$usuario = $_POST['usuario'] ?? '';
$email = $_POST['email'] ?? '';
$telefono = $_POST['telefono'] ?? '';
$fecha = $_POST['fecha'] ?? '';
$genero = $_POST['genero'] ?? '';
$rol = $_POST['rol'] ?? '';
$estrategia = isset($_POST['juego_estrategia']) ? (int)$_POST['juego_estrategia'] : 0;
$accion = isset($_POST['juego_accion']) ? (int)$_POST['juego_accion'] : 0;
$rpg = isset($_POST['juego_rpg']) ? (int)$_POST['juego_rpg'] : 0;
$puzzle = isset($_POST['juego_puzzle']) ? (int)$_POST['juego_puzzle'] : 0;
$carreras = isset($_POST['juego_carreras']) ? (int)$_POST['juego_carreras'] : 0;
$password = $_POST['password'] ?? '';

// Validación mínima
if ($usuario === '' || $email === '' || $password === '') {
  echo json_encode([
    "success" => false,
    "message" => "Faltan campos obligatorios"
  ]);
  exit;
}

// Configuración BD
$servername = "localhost";
$database = "ada";
$username = "root";
$dbpassword = "";

// Conexión
$conn = new mysqli($servername, $username, $dbpassword, $database);
if ($conn->connect_error) {
  echo json_encode([
    "success" => false,
    "message" => "Error conexión DB"
  ]);
  exit;
}

$conn->begin_transaction();

try {
  // INSERT en usuarios
  $sql = "INSERT INTO usuarios
  (idUsuario, usuario, email, telefono, fecha, genero, rol, juego_estrategia, juego_accion, juego_rpg, juego_puzzle, juego_carreras, password, fecha_registro)
  VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

  $stmt = $conn->prepare($sql);
  $stmt->bind_param(
    "ssssssiiiiis",
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
    $password
  );

  if (!$stmt->execute()) {
    throw new Exception("Error al insertar en usuarios");
  }
  $stmt->close();

  // INSERT en alumnos (puntuación inicial 0)
  $sql2 = "INSERT INTO alumnos (idAlumno, alumno, puntuacion)
           VALUES (NULL, ?, 0)";

  $stmt2 = $conn->prepare($sql2);
  $stmt2->bind_param("s", $usuario);

  if (!$stmt2->execute()) {
    throw new Exception("Error al insertar en alumnos");
  }
  $stmt2->close();

  $conn->commit();

  echo json_encode([
    "success" => true,
    "message" => "Registro correcto"
  ]);

} catch (Exception $e) {
  $conn->rollback();
  echo json_encode([
    "success" => false,
    "message" => $e->getMessage()
  ]);
}

$conn->close();
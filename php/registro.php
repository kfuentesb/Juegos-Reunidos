<?php
header('Content-Type: application/json; charset=utf-8'); // Respuesta en JSON y UTF-8. Cabecera HTTP

// Recoger datos enviados por POST (si no existen, se ponen como cadena vacía)
$usuario = $_POST['usuario'] ?? ''; // El operador ?? verifica si $_POST['usuario'] existe y no es null. Si no, asigna ''.
$email = $_POST['email'] ?? '';
$telefono = $_POST['telefono'] ?? '';
$fecha = $_POST['fecha'] ?? '';
$genero = $_POST['genero'] ?? '';
$rol = $_POST['rol'] ?? '';
$estrategia = isset($_POST['juego_estrategia']) ? (int)$_POST['juego_estrategia'] : 0;
$accion = isset($_POST['juego_accion']) ? (int)$_POST['juego_accion'] : 0;
$rpg = isset($_POST['juego_rpg']) ? (int)$_POST['juego_rpg'] : 0; // Si el checkbox no se marca, no se envía, por eso usamos isset para asignar 0 si no existe
$puzzle = isset($_POST['juego_puzzle']) ? (int)$_POST['juego_puzzle'] : 0;
$carreras = isset($_POST['juego_carreras']) ? (int)$_POST['juego_carreras'] : 0;
$password = $_POST['password'] ?? '';

// Validación mínima: si faltan campos obligatorios, devolvemos error
if ($usuario === '' || $email === '' || $password === '') {
  echo json_encode([
    "success" => false,
    "message" => "Faltan campos obligatorios"
  ]);
  exit;
}

// Configuración de la base de datos
$servername = "localhost";
$database = "ada";
$username = "root";
$dbpassword = "";

// Conexión a la base de datos
$conn = new mysqli($servername, $username, $dbpassword, $database);
if ($conn->connect_error) {
  echo json_encode([
    "success" => false,
    "message" => "Error conexión DB"
  ]);
  exit;
}

// Iniciamos una transacción (para insertar en dos tablas a la vez)
$conn->begin_transaction(); // Al iniciar una transacción, las consultas no se aplican hasta que se confirme con commit(). Si algo falla, se puede deshacer con rollback().

try {
  // INSERT en tabla usuarios
  $sql = "INSERT INTO usuarios
  (idUsuario, usuario, email, telefono, fecha, genero, rol, juego_estrategia, juego_accion, juego_rpg, juego_puzzle, juego_carreras, password, fecha_registro)
  VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

  $stmt = $conn->prepare($sql); // Preparamos la consulta
  $stmt->bind_param(
    "ssssssiiiiis", // Tipos: 6 strings + 5 ints + 1 string
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

  // Ejecutamos y comprobamos que no falle
  if (!$stmt->execute()) {
    throw new Exception("Error al insertar en usuarios");
  }
  $stmt->close();

  // INSERT en tabla alumnos (puntuación inicial 0)
  $sql2 = "INSERT INTO alumnos (idAlumno, alumno, puntuacion)
           VALUES (NULL, ?, 0)";

  $stmt2 = $conn->prepare($sql2);
  $stmt2->bind_param("s", $usuario);

  // Ejecutamos y comprobamos que no falle
  if (!$stmt2->execute()) {
    throw new Exception("Error al insertar en alumnos");
  }
  $stmt2->close();

  // Si todo fue bien, confirmamos la transacción
  $conn->commit();

  // Respuesta de éxito
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

// Cerramos conexión
$conn->close();
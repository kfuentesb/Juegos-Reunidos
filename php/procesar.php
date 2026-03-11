<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$accion = $_POST['accion'] ?? '';

if ($accion === 'estado') {
  if (isset($_SESSION['user'])) {
    echo json_encode([
      "loggedIn" => true,
      "user" => $_SESSION['user']
    ]);
  } else {
    echo json_encode([
      "loggedIn" => false
    ]);
  }
  exit;
}

if ($accion === 'logout') {
  session_unset();
  session_destroy();
  echo json_encode([
    "success" => true
  ]);
  exit;
}

if ($accion !== 'login') {
  echo json_encode([
    "success" => false,
    "message" => "Acción no válida"
  ]);
  exit;
}

$usuario = isset($_POST['usuario']) ? trim($_POST['usuario']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';

if ($usuario === '' || $password === '') {
  echo json_encode([
    "success" => false,
    "message" => "Usuario y contraseña obligatorios"
  ]);
  exit;
}

$conn = new mysqli("localhost", "root", "", "ada");
if ($conn->connect_error) {
  echo json_encode([
    "success" => false,
    "message" => "Error conexión DB"
  ]);
  exit;
}

$sql = "SELECT usuario, rol, tipo, password 
        FROM usuarios 
        WHERE usuario = ? LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $usuario);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
  echo json_encode([
    "success" => false,
    "message" => "Usuario no encontrado"
  ]);
  $stmt->close();
  $conn->close();
  exit;
}

$row = $result->fetch_assoc();

if ($row['password'] !== $password) {
  echo json_encode([
    "success" => false,
    "message" => "Contraseña incorrecta"
  ]);
  $stmt->close();
  $conn->close();
  exit;
}

$puntuacion = 0;
$sql2 = "SELECT puntuacion FROM alumnos WHERE alumno = ? LIMIT 1";
$stmt2 = $conn->prepare($sql2);
$stmt2->bind_param("s", $usuario);
$stmt2->execute();
$res2 = $stmt2->get_result();

if ($res2->num_rows > 0) {
  $puntuacion = (int)$res2->fetch_assoc()['puntuacion'];
}
$stmt2->close();

$userData = [
  'user' => $row['usuario'],
  'rol' => $row['tipo'],        // Para admin check
  'tipo' => $row['tipo'],       // Admin/jugador real
  'frecuencia' => $row['rol'],  // Frecuencia real
  'puntuacion' => $puntuacion,
  'avatar' => "https://api.dicebear.com/7.x/avataaars/svg?seed=" . urlencode($row['usuario'])
];

$_SESSION['user'] = $userData;

echo json_encode([
  "success" => true,
  "user" => $userData
]);

$stmt->close();
$conn->close();
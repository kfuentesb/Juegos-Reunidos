<?php
header('Content-Type: application/json; charset=utf-8');

// 1) Comprobar acción
$accion = isset($_POST['accion']) ? $_POST['accion'] : '';

if ($accion !== 'login') {
  echo json_encode([
    'success' => false,
    'message' => 'Acción no válida'
  ]);
  exit;
}

// 2) Recoger datos
$usuario = isset($_POST['usuario']) ? trim($_POST['usuario']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';

if ($usuario === '' || $password === '') {
  echo json_encode([
    'success' => false,
    'message' => 'Usuario y contraseña obligatorios'
  ]);
  exit;
}

// 3) Configuración BD
$servername = "localhost";
$database = "ada";
$username = "root";
$dbpassword = "";

// 4) Conexión
$conn = new mysqli($servername, $username, $dbpassword, $database);
if ($conn->connect_error) {
  echo json_encode([
    'success' => false,
    'message' => 'Error conexión DB'
  ]);
  exit;
}

// 5) Consulta (ajusta nombres de tabla/campos si no coinciden)
$sql = "SELECT usuario, nombre, rol, monedas, avatar, password 
        FROM usuarios 
        WHERE usuario = ? LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $usuario);
$stmt->execute();

$result = $stmt->get_result();
if ($result->num_rows === 0) {
  echo json_encode([
    'success' => false,
    'message' => 'Usuario no encontrado'
  ]);
  $stmt->close();
  $conn->close();
  exit;
}

$row = $result->fetch_assoc();

// 6) Verificar password (texto plano)
if ($row['password'] !== $password) {
  echo json_encode([
    'success' => false,
    'message' => 'Contraseña incorrecta'
  ]);
  $stmt->close();
  $conn->close();
  exit;
}

// 7) Respuesta OK
$userData = [
  'user' => $row['usuario'],
  'nombre' => $row['nombre'],
  'rol' => $row['rol'],
  'monedas' => (int)$row['monedas'],
  'avatar' => $row['avatar']
];

echo json_encode([
  'success' => true,
  'user' => $userData
]);

$stmt->close();
$conn->close();
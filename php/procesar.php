<?php
session_start(); // Inicia la sesión PHP para poder guardar el usuario
header('Content-Type: application/json; charset=utf-8'); // Respuesta en JSON

$accion = $_POST['accion'] ?? ''; // Acción recibida (login, logout, estado)

/* =========================
   1) ESTADO DE SESIÓN
   ========================= */
if ($accion === 'estado') {
  // Si hay sesión, devolvemos al usuario
  if (isset($_SESSION['user'])) { // comprobar un array con la sesion
    echo json_encode([ // Si hay sesion devolvemos al usuario (se convierte en JSON)
      "loggedIn" => true,
      "user" => $_SESSION['user']
    ]);
  } else { // No existe
    echo json_encode([
      "loggedIn" => false
    ]);
  }
  exit;
}

/* =========================
   2) LOGOUT
   ========================= */
if ($accion === 'logout') {
  // Limpiamos y destruimos la sesión
  session_unset(); // Elimina todas las variables de sesión
  session_destroy(); // Destruye la sesión del servidor
  echo json_encode([ // Envia el json con success
    "success" => true
  ]);
  exit;
}

/* =========================
   3) VALIDAR ACCIÓN
   ========================= */
if ($accion !== 'login') {
  echo json_encode([
    "success" => false,
    "message" => "Acción no válida"
  ]);
  exit;
}

/* =========================
   4) RECIBIR CREDENCIALES
   ========================= */
    // Recibimos el usuario y el password y limpiamos espacios y con isset verificamos si existe
$usuario = isset($_POST['usuario']) ? trim($_POST['usuario']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';

// Si faltan datos, error
if ($usuario === '' || $password === '') {
  echo json_encode([ // JSON error si falta algo
    "success" => false, 
    "message" => "Usuario y contraseña obligatorios"
  ]);
  exit;
}

/* =========================
   5) CONEXIÓN A BD
   ========================= */
$servername = "localhost";
$database = "ada";
$username = "root";
$dbpassword = "";

$conn = new mysqli($servername, $username, $dbpassword, $database); // Objeto de conexión
if ($conn->connect_error) { // Si hay error de conexion
  echo json_encode([ // JSON
    "success" => false,
    "message" => "Error conexión DB"
  ]);
  exit;
}

/* =========================
   6) BUSCAR USUARIO
   ========================= */
$sql = "SELECT usuario, rol, password 
        FROM usuarios 
        WHERE usuario = ? LIMIT 1";

$stmt = $conn->prepare($sql); // Preparamos la consulta segura
$stmt->bind_param("s", $usuario); // Pasamos un string y $usuario reemplaza ?
$stmt->execute(); // Ejecuta
$result = $stmt->get_result(); // Objeto resultado

if ($result->num_rows === 0) { // En caso de 0 filas, no encontro nada
  echo json_encode([
    "success" => false,
    "message" => "Usuario no encontrado"
  ]);
  // Cerramos statement y conexion
  $stmt->close();
  $conn->close();
  exit;
}
/**$row = [
  "usuario" => "Kevin",
  "rol" => "admin",
  "password" => "hash_almacenado"
]; */
$row = $result->fetch_assoc(); // Convertir a array asociativo


/* =========================
   7) COMPROBAR CONTRASEÑA
   ========================= */
if ($row['password'] !== $password) { // Si no coinciden, error
  echo json_encode([
    "success" => false,
    "message" => "Contraseña incorrecta"
  ]);
  $stmt->close();
  $conn->close();
  exit;
}

/* =========================
   8) OBTENER PUNTUACIÓN
   ========================= */
$puntuacion = 0;
$sql2 = "SELECT puntuacion FROM alumnos WHERE alumno = ? LIMIT 1"; // Consulta para obtener la puntuación del alumno
$stmt2 = $conn->prepare($sql2);
$stmt2->bind_param("s", $usuario); // Pasamos el nombre de usuario para buscar su puntuación
$stmt2->execute();
$res2 = $stmt2->get_result(); // Si hay resultado, obtenemos la puntuación (si no, queda en 0)

if ($res2->num_rows > 0) {
  // La idea es ['usuario' => 'Kevin', 'puntuacion' => 150]
  $puntuacion = (int)$res2->fetch_assoc()['puntuacion']; // Array asociativo con puntuación en int
}
$stmt2->close();

/* =========================
   9) GUARDAR SESIÓN
   ========================= */
$userData = [ // Datos del usuario a guardar
  'user' => $row['usuario'],
  'rol' => $row['rol'],
  'puntuacion' => $puntuacion,
  'avatar' => "https://api.dicebear.com/7.x/avataaars/svg?seed=" . urlencode($row['usuario']) // Asegura el nombre usuario en la url
];

$_SESSION['user'] = $userData; // guardar sesión

/* =========================
   10) RESPUESTA FINAL
   ========================= */
echo json_encode([ // JSON exito, enviamos a $userData
  "success" => true,
  "user" => $userData
]);

$stmt->close();
$conn->close();
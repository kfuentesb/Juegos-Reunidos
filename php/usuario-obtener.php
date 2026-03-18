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

$usuario = $_POST['usuario'] ?? '';

if (!$usuario) {
  echo json_encode([
    'success' => false,
    'message' => 'Usuario no especificado'
  ]);
  exit;
}

// Solo puede ver su propio perfil (o un admin puede ver cualquiera)
$sessionUser = $_SESSION['user']['user'];
$sessionTipo = $_SESSION['user']['tipo'] ?? 'jugador';

if ($usuario !== $sessionUser && $sessionTipo !== 'admin') {
  echo json_encode([
    'success' => false,
    'message' => 'No tienes permiso para ver este perfil'
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

// Consulta para obtener todos los datos del usuario
$sql = "SELECT 
          u.usuario,
          u.email,
          u.telefono,
          u.fecha,
          u.genero,
          u.rol,
          u.juego_estrategia,
          u.juego_accion,
          u.juego_rpg,
          u.juego_puzzle,
          u.juego_carreras,
          u.tipo,
          u.fecha_registro,
          COALESCE(a.puntuacion, 0) AS puntuacion
        FROM usuarios u
        LEFT JOIN alumnos a ON u.usuario = a.alumno
        WHERE u.usuario = ?
        LIMIT 1";

$stmt = $conn->prepare($sql);
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

$fila = $result->fetch_assoc();
$stmt->close();
$conn->close();

$usuarioData = [
  "usuario"           => $fila["usuario"],
  "email"             => $fila["email"],
  "telefono"          => $fila["telefono"],
  "fecha"             => $fila["fecha"],
  "genero"            => $fila["genero"],
  "rol"               => $fila["rol"],
  "juego_estrategia"  => (int)$fila["juego_estrategia"],
  "juego_accion"      => (int)$fila["juego_accion"],
  "juego_rpg"         => (int)$fila["juego_rpg"],
  "juego_puzzle"      => (int)$fila["juego_puzzle"],
  "juego_carreras"    => (int)$fila["juego_carreras"],
  "tipo"              => $fila["tipo"],
  "fecha_registro"    => $fila["fecha_registro"],
  "puntuacion"        => (int)$fila["puntuacion"]
];

echo json_encode([
  'success' => true,
  'usuario' => $usuarioData
]);

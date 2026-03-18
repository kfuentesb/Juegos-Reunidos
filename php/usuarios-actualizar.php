<?php
// Especifica que la respuesta será en formato JSON
header('Content-Type: application/json');

// Recoge los datos enviados por POST, usando valores por defecto si no existen
$usuario = $_POST['usuario'] ?? '';
$email = $_POST['email'] ?? '';
$rol = $_POST['rol'] ?? '';
$tipo = $_POST['tipo'] ?? '';
// Si la puntuación no está definida, por defecto es 0 (y la convierte a entero)
$puntuacion = isset($_POST['puntuacion']) ? (int)$_POST['puntuacion'] : 0;

// Comprueba que todos los campos obligatorios están completos
if ($usuario === '' || $email === '' || $rol === '' || $tipo === '') {
  // Si falta algún campo, responde con error en formato JSON y termina la ejecución
  echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
  exit;
}

// Crea una conexión a la base de datos MySQL (servidor local, usuario root, sin contraseña, BD "ada")
$conn = new mysqli("localhost", "root", "", "ada");

// Si hay error en la conexión, responde con error y termina la ejecución
if ($conn->connect_error) {
  echo json_encode(['success' => false, 'message' => 'Error conexión DB']);
  exit;
}

// Inicia una transacción SQL para asegurar que ambos UPDATE se hagan de manera atómica
$conn->begin_transaction();

try {
  // Prepara y ejecuta la primera consulta: actualiza email, rol y tipo del usuario
  $stmt1 = $conn->prepare("UPDATE usuarios SET email = ?, rol = ?, tipo = ? WHERE usuario = ?");
  $stmt1->bind_param("ssss", $email, $rol, $tipo, $usuario);
  $stmt1->execute();

  // Prepara y ejecuta la segunda consulta: actualiza la puntuación en la tabla alumnos
  $stmt2 = $conn->prepare("UPDATE alumnos SET puntuacion = ? WHERE alumno = ?");
  $stmt2->bind_param("is", $puntuacion, $usuario);
  $stmt2->execute();

  // Si las dos actualizaciones fueron exitosas, confirma la transacción
  $conn->commit();
  // Responde indicando éxito
  echo json_encode(['success' => true]);
} catch (Exception $e) {
  // Si ocurre un error en cualquiera de los pasos, revierte la transacción
  $conn->rollback();
  // Devuelve un mensaje de error en formato JSON
  echo json_encode(['success' => false, 'message' => 'Error al actualizar']);
}

// Cierra la conexión a la base de datos
$conn->close();
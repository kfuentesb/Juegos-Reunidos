<?php
/**
 * usuarios-lista.php
 * Devuelve la lista de usuarios en formato JSON para el panel de administración.
 * Hace un LEFT JOIN con la tabla alumnos para obtener:
 *   - idAlumno: identificador en la tabla alumnos
 *   - usuario: nombre del alumno (clave foránea)
 *   - puntuacion: puntuación del alumno
 * Además incluye email, rol (frecuencia) y tipo (admin/jugador) de la tabla usuarios.
 * Los datos se devuelven como array JSON para ser consumidos por fetch() desde el frontend.
 */
header('Content-Type: application/json; charset=utf-8');

$conn = new mysqli("localhost", "root", "", "ada");
if ($conn->connect_error) {
  // En caso de error de conexión devolvemos array vacío
  echo json_encode([]);
  exit;
}

// JOIN entre usuarios y alumnos para obtener idAlumno, nombre alumno y puntuación
$sql = "SELECT usuarios.usuario,
               usuarios.email,
               usuarios.rol,
               usuarios.tipo,
               alumnos.idAlumno,
               COALESCE(alumnos.puntuacion, 0) AS puntuacion
        FROM usuarios
        LEFT JOIN alumnos ON usuarios.usuario = alumnos.alumno
        ORDER BY usuarios.usuario ASC";

$result = $conn->query($sql);

$usuarios = [];
while ($fila = $result->fetch_assoc()) {
  $usuarios[] = [
    "idAlumno"   => $fila["idAlumno"] !== null ? (int)$fila["idAlumno"] : null,
    "usuario"    => $fila["usuario"],
    "email"      => $fila["email"],
    "rol"        => $fila["rol"],     // frecuencia: a-diario, semanalmente, ocasionalmente
    "tipo"       => $fila["tipo"],    // admin / jugador
    "puntuacion" => (int)$fila["puntuacion"]
  ];
}

// Respuesta JSON con el array de usuarios
echo json_encode($usuarios);
$conn->close();
<?php  

$usuario = $_POST['usuario'];
$email = $_POST['email'];
$telefono = $_POST['telefono'];
$fecha = $_POST['fecha'];
$genero = $_POST['genero'];
$rol = $_POST['rol'];

$estrategia = isset($_POST['juego_estrategia']) ? 1 : 0;
$accion = isset($_POST['juego_accion']) ? 1 : 0;
$rpg = isset($_POST['juego_rpg']) ? 1 : 0;
$puzzle = isset($_POST['juego_puzzle']) ? 1 : 0;
$carreras = isset($_POST['juego_carreras']) ? 1 : 0;

$password = $_POST['password'];

// Conexion base de datos
$servername = "localhost";
$database = "usuarios";
$username = "root";
$password = "";

// Create connection
$conn = new mysqli($servername, $username, $password, $database);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$sql = "INSERT idUsuario, usuario, email, telefono, fecha, genero, rol, juego_estrategia, juego_accion, juego_rpg, 
        juego_puzzle, juego_carreras, password, fecha_registro 
        VALUES (NULL, '$usuario', '$email', '$telefono', '$fecha', '$genero', '$rol',
        '$estrategia', '$accion', '$rpg', '$puzzle', '$carreras',
        '$password', NOW()) FROM usuarios";

$result = $conn->query($sql);

$rawdata = array(); //creamos un array

//guardamos en un array multidimensional todos los datos de la consulta
$i=0;

while($row = mysqli_fetch_assoc($result))
{
    $rawdata[$i] = $row;
    $i++;
}

$conn->close();
echo json_encode($rawdata);

?>
// =======================
// VARIABLES GLOBALES - USUARIOS
// =======================
let tablaUsuarios = null;
let chartTipos = null;
let chartPuntuacion = null;
let editModal = null;
let addModal = null;
let usuarios = [];

// =======================================
// FUNCIONES FETCH PARA BASE DE DATOS
// =======================================
function fetchUsuarios() {
  return fetch('../php/usuarios-lista.php')
    .then(res => {
      if (!res.ok) throw new Error('Error al cargar usuarios');
      return res.json();
    });
}

function fetchCrearUsuario(formData) {
  return fetch('../php/usuarios-crear.php', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al crear usuario');
    return res.json();
  });
}

function fetchActualizarUsuario(formData) {
  return fetch('../php/usuarios-actualizar.php', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al actualizar usuario');
    return res.json();
  });
}

function fetchEliminarUsuario(usuario) {
  const formData = new FormData();
  formData.append('usuario', usuario);

  return fetch('../php/usuarios-eliminar.php', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al eliminar usuario');
    return res.json();
  });
}
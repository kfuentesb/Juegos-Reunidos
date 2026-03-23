// ========================================================================
// INICIO: SECCION PRINCIPAL EJECUTADA AL CARGAR LA PAGINA
// ========================================================================
document.addEventListener("DOMContentLoaded", function () {
  // Inicializa los modales de Bootstrap
  if (window.bootstrap?.Modal) {
    editModal = new bootstrap.Modal(document.getElementById("editUserModal"));
    addModal = new bootstrap.Modal(document.getElementById("addUserModal"));
  }

  // Carga los usuarios desde la base de datos
  cargarUsuarios();

  // Carga los datos de juegos
  cargarDatosJuegos();

  // ======================
  // EVENTOS DE USUARIOS
  // ======================

  document.getElementById("btn-add-user")?.addEventListener("click", () => {
    document.getElementById("addUserForm").reset();
    addModal?.show();
  });

  document.getElementById("addUserForm")?.addEventListener("submit", function (e) {
    e.preventDefault();
    const password = document.getElementById("add-password").value;
    const password2 = document.getElementById("add-password2").value;

    if (password !== password2) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const formData = new FormData();
    formData.append('usuario', document.getElementById("add-usuario").value.trim());
    formData.append('email', document.getElementById("add-email").value.trim());
    formData.append('telefono', document.getElementById("add-telefono").value.trim());
    formData.append('fecha', document.getElementById("add-fecha").value);
    formData.append('genero', document.getElementById("add-genero").value);
    formData.append('rol', document.getElementById("add-rol").value);
    formData.append('tipo', document.getElementById("add-tipo").value);
    formData.append('password', password);
    formData.append('puntuacion', document.getElementById("add-puntuacion").value || 0);
    formData.append('juego_estrategia', document.getElementById("add-estrategia").checked ? 1 : 0);
    formData.append('juego_accion', document.getElementById("add-accion").checked ? 1 : 0);
    formData.append('juego_rpg', document.getElementById("add-rpg").checked ? 1 : 0);
    formData.append('juego_puzzle', document.getElementById("add-puzzle").checked ? 1 : 0);
    formData.append('juego_carreras', document.getElementById("add-carreras").checked ? 1 : 0);

    fetchCrearUsuario(formData)
      .then(data => {
        if (data.success) {
          alert('Usuario creado correctamente');
          addModal?.hide();
          cargarUsuarios();
        } else {
          alert('Error: ' + (data.message || 'No se pudo crear el usuario'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error al crear el usuario');
      });
  });

  document.getElementById("editUserForm")?.addEventListener("submit", function (e) {
    e.preventDefault();

    const usuarioOriginal = document.getElementById("edit-usuario-original").value;
    const password = document.getElementById("edit-password").value;
    const formData = new FormData();
    formData.append('usuario_original', usuarioOriginal);
    formData.append('usuario', document.getElementById("edit-usuario").value.trim());
    formData.append('email', document.getElementById("edit-email").value.trim());
    formData.append('telefono', document.getElementById("edit-telefono").value.trim());
    formData.append('fecha', document.getElementById("edit-fecha").value);
    formData.append('genero', document.getElementById("edit-genero").value);
    formData.append('rol', document.getElementById("edit-rol").value);
    formData.append('tipo', document.getElementById("edit-tipo").value);
    formData.append('puntuacion', document.getElementById("edit-puntuacion").value || 0);
    formData.append('juego_estrategia', document.getElementById("edit-estrategia").checked ? 1 : 0);
    formData.append('juego_accion', document.getElementById("edit-accion").checked ? 1 : 0);
    formData.append('juego_rpg', document.getElementById("edit-rpg").checked ? 1 : 0);
    formData.append('juego_puzzle', document.getElementById("edit-puzzle").checked ? 1 : 0);
    formData.append('juego_carreras', document.getElementById("edit-carreras").checked ? 1 : 0);

    if (password) {
      formData.append('password', password);
    }

    fetchActualizarUsuario(formData)
      .then(data => {
        if (data.success) {
          alert('Usuario actualizado correctamente');
          editModal?.hide();
          cargarUsuarios();
        } else {
          alert('Error: ' + (data.message || 'No se pudo actualizar el usuario'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error al actualizar el usuario');
      });
  });

  // ======================
  // EVENTOS DE JUEGOS
  // ======================
  document.getElementById('filtro-tipo-juego')?.addEventListener('change', mostrarTablaJuegos);
});
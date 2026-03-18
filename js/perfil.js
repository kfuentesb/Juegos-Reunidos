// =======================
// VARIABLES GLOBALES
// =======================
let usuarioActual = null;
let datosUsuario = null;
let bajaModal = null;

// =======================
// FUNCIONES FETCH
// =======================

/**
 * Obtiene el estado de la sesión actual
 * @returns {Promise<Object>} Datos de la sesión
 */
function fetchEstadoSesion() {
  const formData = new FormData();
  formData.append('accion', 'estado');
  
  return fetch('../php/procesar.php', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al verificar sesión');
    return res.json();
  });
}

/**
 * Obtiene los datos completos de un usuario
 * @param {string} usuario Nombre del usuario
 * @returns {Promise<Object>} Datos del usuario
 */
function fetchObtenerUsuario(usuario) {
  const formData = new FormData();
  formData.append('usuario', usuario);
  
  return fetch('../php/usuario-obtener.php', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al obtener usuario');
    return res.json();
  });
}

/**
 * Actualiza el perfil del usuario
 * @param {FormData} formData Datos del perfil
 * @returns {Promise<Object>} Respuesta del servidor
 */
function fetchActualizarPerfil(formData) {
  return fetch('../php/usuario-perfil-actualizar.php', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al actualizar perfil');
    return res.json();
  });
}

/**
 * Elimina la cuenta del usuario
 * @param {string} usuario Nombre del usuario
 * @param {string} password Contraseña para confirmar
 * @returns {Promise<Object>} Respuesta del servidor
 */
function fetchEliminarCuenta(usuario, password) {
  const formData = new FormData();
  formData.append('usuario', usuario);
  formData.append('password', password);
  
  return fetch('../php/usuario-eliminar-perfil.php', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al eliminar cuenta');
    return res.json();
  });
}

/**
 * Cierra la sesión del usuario
 * @returns {Promise<Object>} Respuesta del servidor
 */
function fetchCerrarSesion() {
  const formData = new FormData();
  formData.append('accion', 'logout');
  
  return fetch('../php/procesar.php', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al cerrar sesión');
    return res.json();
  });
}

// =======================
// FUNCIONES DE UI
// =======================

/**
 * Formatea los intereses como badges
 * @param {Object} u Usuario
 * @returns {string} HTML con badges
 */
function formatearIntereses(u) {
  const intereses = [];
  if (parseInt(u.juego_estrategia)) intereses.push('<span class="badge bg-primary intereses-badge">Estrategia</span>');
  if (parseInt(u.juego_accion)) intereses.push('<span class="badge bg-danger intereses-badge">Acción</span>');
  if (parseInt(u.juego_rpg)) intereses.push('<span class="badge bg-success intereses-badge">RPG</span>');
  if (parseInt(u.juego_puzzle)) intereses.push('<span class="badge bg-warning intereses-badge">Puzzles</span>');
  if (parseInt(u.juego_carreras)) intereses.push('<span class="badge bg-info intereses-badge">Carreras</span>');
  return intereses.length ? intereses.join(' ') : '<span class="text-muted">No has seleccionado intereses</span>';
}

/**
 * Formatea la frecuencia para mostrar
 * @param {string} rol Rol/frecuencia
 * @returns {string} Frecuencia formateada
 */
function formatearFrecuencia(rol) {
  const frecuencias = {
    'a-diario': 'A diario',
    'semanalmente': 'Semanalmente',
    'ocasionalmente': 'Ocasionalmente'
  };
  return frecuencias[rol] || rol;
}

/**
 * Carga y muestra los datos del usuario en el perfil
 * @param {string} username Nombre del usuario
 */
function cargarPerfil(username) {
  fetchObtenerUsuario(username)
    .then(data => {
      if (data.success && data.usuario) {
        datosUsuario = data.usuario;
        mostrarDatosPerfil(datosUsuario);
      } else {
        alert('Error al cargar los datos del perfil');
        window.location.href = '../index.html';
      }
    })
    .catch(err => {
      console.error('Error cargando perfil:', err);
      alert('Error al cargar el perfil');
    });
}

/**
 * Muestra los datos del usuario en la interfaz
 * @param {Object} u Datos del usuario
 */
function mostrarDatosPerfil(u) {
  // Header
  document.getElementById('profile-avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.usuario)}`;
  document.getElementById('profile-username').textContent = u.usuario;
  document.getElementById('profile-type').textContent = u.tipo === 'admin' ? 'Administrador' : 'Jugador';

  // Mostrar enlace admin si es administrador
  if (u.tipo === 'admin') {
    document.getElementById('admin-nav-item').style.display = 'block';
  }

  // Estadísticas
  document.getElementById('stat-puntuacion').textContent = u.puntuacion || 0;
  document.getElementById('stat-frecuencia').textContent = formatearFrecuencia(u.rol);
  document.getElementById('stat-miembro').textContent = u.fecha_registro ? u.fecha_registro.split('-')[0] : '2026';

  // Formulario
  document.getElementById('perfil-usuario').value = u.usuario;
  document.getElementById('perfil-email').value = u.email || '';
  document.getElementById('perfil-telefono').value = u.telefono || '';
  document.getElementById('perfil-fecha').value = u.fecha || '';
  document.getElementById('perfil-genero').value = u.genero || 'no-decirlo';
  document.getElementById('perfil-rol').value = u.rol || 'a-diario';

  // Intereses (checkboxes)
  document.getElementById('perfil-estrategia').checked = parseInt(u.juego_estrategia) === 1;
  document.getElementById('perfil-accion').checked = parseInt(u.juego_accion) === 1;
  document.getElementById('perfil-rpg').checked = parseInt(u.juego_rpg) === 1;
  document.getElementById('perfil-puzzle').checked = parseInt(u.juego_puzzle) === 1;
  document.getElementById('perfil-carreras').checked = parseInt(u.juego_carreras) === 1;

  // Intereses en el panel lateral
  document.getElementById('intereses-container').innerHTML = formatearIntereses(u);
}

// =======================
// EVENTOS
// =======================

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar modal de baja
  if (window.bootstrap?.Modal) {
    bajaModal = new bootstrap.Modal(document.getElementById("confirmarBajaModal"));
  }

  // Verificar sesión y cargar perfil
  fetchEstadoSesion()
    .then(data => {
      if (data.loggedIn && data.user) {
        usuarioActual = data.user.user;
        cargarPerfil(usuarioActual);
      } else {
        alert('Debes iniciar sesión para ver tu perfil');
        window.location.href = '../index.html';
      }
    })
    .catch(err => {
      console.error('Error verificando sesión:', err);
      alert('Error al verificar la sesión');
      window.location.href = '../index.html';
    });

  // Formulario de edición de perfil
  document.getElementById('perfilForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const password = document.getElementById('perfil-password').value;
    const password2 = document.getElementById('perfil-password2').value;

    // Validar contraseñas si se proporcionaron
    if (password || password2) {
      if (password !== password2) {
        alert('Las contraseñas no coinciden');
        return;
      }
      if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    const formData = new FormData();
    formData.append('usuario', document.getElementById('perfil-usuario').value);
    formData.append('email', document.getElementById('perfil-email').value.trim());
    formData.append('telefono', document.getElementById('perfil-telefono').value.trim());
    formData.append('fecha', document.getElementById('perfil-fecha').value);
    formData.append('genero', document.getElementById('perfil-genero').value);
    formData.append('rol', document.getElementById('perfil-rol').value);
    formData.append('juego_estrategia', document.getElementById('perfil-estrategia').checked ? 1 : 0);
    formData.append('juego_accion', document.getElementById('perfil-accion').checked ? 1 : 0);
    formData.append('juego_rpg', document.getElementById('perfil-rpg').checked ? 1 : 0);
    formData.append('juego_puzzle', document.getElementById('perfil-puzzle').checked ? 1 : 0);
    formData.append('juego_carreras', document.getElementById('perfil-carreras').checked ? 1 : 0);
    
    if (password) {
      formData.append('password', password);
    }

    fetchActualizarPerfil(formData)
      .then(data => {
        if (data.success) {
          alert('Perfil actualizado correctamente');
          // Limpiar campos de contraseña
          document.getElementById('perfil-password').value = '';
          document.getElementById('perfil-password2').value = '';
          // Recargar datos
          cargarPerfil(usuarioActual);
        } else {
          alert('Error: ' + (data.message || 'No se pudo actualizar el perfil'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error al actualizar el perfil');
      });
  });

  // Botón darse de baja - abrir modal
  document.getElementById('btn-darse-baja')?.addEventListener('click', function() {
    document.getElementById('confirmar-password').value = '';
    bajaModal?.show();
  });

  // Confirmar baja
  document.getElementById('btn-confirmar-baja')?.addEventListener('click', function() {
    const password = document.getElementById('confirmar-password').value;
    
    if (!password) {
      alert('Debes introducir tu contraseña para confirmar');
      return;
    }

    fetchEliminarCuenta(usuarioActual, password)
      .then(data => {
        if (data.success) {
          alert('Tu cuenta ha sido eliminada. Serás redirigido a la página principal.');
          window.location.href = '../index.html';
        } else {
          alert('Error: ' + (data.message || 'No se pudo eliminar la cuenta'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error al eliminar la cuenta');
      });
  });

  // Cerrar sesión
  document.getElementById('btn-cerrar-sesion')?.addEventListener('click', function() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      fetchCerrarSesion()
        .then(data => {
          if (data.success) {
            window.location.href = '../index.html';
          } else {
            alert('Error al cerrar sesión');
          }
        })
        .catch(err => {
          console.error(err);
          alert('Error al cerrar sesión');
        });
    }
  });
});

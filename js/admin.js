/* ================================================================
   PANEL DE ADMINISTRADOR - admin.js
   ----------------------------------------------------------------
   Cómo funciona este módulo:

   1. VERIFICACIÓN DE ACCESO:
      Al cargar la página se lee la sesión de localStorage y se
      comprueba que el rol sea "admin". Si no lo es, se redirige
      al inicio (index.html).

   2. CARGA DE DATOS (fetch + Promesas):
      - Primera carga: fetch('../data/usuarios.json') obtiene los
        usuarios base desde el fichero JSON del servidor.
      - Los usuarios registrados via formulario (localStorage
        "usuarios_registrados") se combinan con la lista base.
      - Las puntuaciones guardadas por los juegos ("jrPuntuaciones")
        se incorporan a cada usuario.
      - El resultado se persiste en localStorage bajo la clave
        "jrAdmin_usuarios" para acelerar cargas posteriores.

   3. DATATABLE:
      - Se usa la librería jQuery DataTables (CDN) para renderizar
        la tabla con búsqueda, paginación y ordenación.
      - Cada fila tiene botones "Editar" y "Eliminar".

   4. CRUD via Promesas:
      - editarUsuario(id, cambios) → Promesa que actualiza localStorage.
      - borrarUsuario(id) → Promesa que elimina de localStorage y
        también de "usuarios_registrados".

   5. GRÁFICA (Chart.js):
      - Gráfica de barras con las puntuaciones por usuario.
      - El título muestra el número total de usuarios.

   6. FORMATO DE DATOS (JSON):
      Todos los datos se almacenan y recuperan en JSON:
      {
        id: number,        – Identificador único del alumno
        user: string,      – Nombre de usuario (login)
        nombre: string,    – Nombre mostrado del alumno
        rol: string,       – "admin" | "user"
        puntuacion: number,– Mejor puntuación en los juegos
        monedas: number    – Monedas acumuladas
      }
   ================================================================ */

// ==============================
// 1. CONSTANTES
// ==============================

/** Clave de localStorage donde se guarda la caché del panel admin */
const ADMIN_KEY = 'jrAdmin_usuarios';

/** Ruta al fichero JSON con los usuarios iniciales (relativa a components/) */
const JSON_URL = '../data/usuarios.json';

// ==============================
// 2. CAPA DE ACCESO A DATOS
//    (API simulada con fetch y Promesas)
// ==============================

/**
 * Carga el fichero usuarios.json usando fetch (Promesa).
 * Si fetch falla (p.ej. protocolo file://, sin servidor HTTP),
 * devuelve los datos estáticos de los usuarios base como fallback.
 * @returns {Promise<Array>} Array con los usuarios del JSON
 */
function fetchUsuariosJSON() {
  return fetch(JSON_URL)
    .then(function(res) {
      if (!res.ok) {
        throw new Error('No se pudo cargar usuarios.json (HTTP ' + res.status + ')');
      }
      // Convertir la respuesta a JSON (también devuelve una Promesa)
      return res.json();
    })
    .catch(function(err) {
      // Fallback: si fetch falla (sin servidor HTTP), usamos datos base estáticos
      console.warn('fetch falló (' + err.message + '). Usando datos estáticos de fallback.');
      return [
        { id: 1, user: 'admin', nombre: 'Jefe de Juegos',   rol: 'admin', puntuacion: 0,   monedas: 99999 },
        { id: 2, user: 'user',  nombre: 'Usuario Ejemplo',  rol: 'user',  puntuacion: 0,   monedas: 150   }
      ];
    });
}

/**
 * Lee la sesión activa desde localStorage y la parsea como JSON.
 * @returns {Object|null} Objeto de sesión o null si no hay sesión
 */
function getSesion() {
  try {
    return JSON.parse(localStorage.getItem('session')) || null;
  } catch (err) {
    console.warn('Error al leer sesión desde localStorage:', err);
    return null;
  }
}

/**
 * Lee la caché de usuarios del panel admin desde localStorage.
 * @returns {Array} Lista de usuarios o [] si está vacía/corrupta
 */
function leerCacheAdmin() {
  try {
    var datos = JSON.parse(localStorage.getItem(ADMIN_KEY));
    return Array.isArray(datos) ? datos : [];
  } catch (err) {
    console.warn('Error al leer caché admin (jrAdmin_usuarios):', err);
    return [];
  }
}

/**
 * Lee los usuarios registrados via formulario (registro.js).
 * @returns {Array}
 */
function leerUsuariosRegistrados() {
  try {
    var datos = JSON.parse(localStorage.getItem('usuarios_registrados'));
    return Array.isArray(datos) ? datos : [];
  } catch (err) {
    console.warn('Error al leer usuarios_registrados:', err);
    return [];
  }
}

/**
 * Lee las puntuaciones guardadas por los juegos.
 * Cada entrada tiene la forma { user: string, puntuacion: number }.
 * @returns {Array}
 */
function leerPuntuaciones() {
  try {
    var datos = JSON.parse(localStorage.getItem('jrPuntuaciones'));
    return Array.isArray(datos) ? datos : [];
  } catch (err) {
    console.warn('Error al leer puntuaciones (jrPuntuaciones):', err);
    return [];
  }
}

/**
 * Escribe la lista de usuarios en localStorage (formato JSON).
 * @param {Array} lista - Array de objetos usuario
 */
function guardarEnCache(lista) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(lista));
}

/**
 * Obtiene la lista completa de usuarios para el panel admin.
 *
 * Flujo:
 *  a) Si ya existe caché en localStorage → la devuelve directamente.
 *  b) Si no → hace fetch del JSON base, lo combina con los usuarios
 *     registrados y con las puntuaciones de los juegos, guarda la
 *     lista en caché y la devuelve.
 *
 * @returns {Promise<Array>} Promesa que resuelve con la lista de usuarios
 */
function obtenerTodosLosUsuarios() {
  return new Promise(function(resolve, reject) {
    var cache = leerCacheAdmin();

    // Si hay datos en caché, los devolvemos sin hacer fetch
    if (cache.length > 0) {
      resolve(cache);
      return;
    }

    // Sin caché: cargamos el JSON inicial con fetch (Promesa)
    fetchUsuariosJSON()
      .then(function(usuariosBase) {
        var registrados  = leerUsuariosRegistrados();
        var puntuaciones = leerPuntuaciones();

        // Calculamos el siguiente ID disponible
        var nextId = Math.max.apply(null, usuariosBase.map(function(u) { return u.id || 0; }).concat([0])) + 1;

        // Convertimos los usuarios registrados al formato del panel
        // Omitimos los que ya existen en la base JSON (por nombre de usuario)
        var registradosFormateados = registrados
          .filter(function(r) {
            return !usuariosBase.find(function(b) { return b.user === r.user; });
          })
          .map(function(r) {
            var pts = puntuaciones.find(function(p) { return p.user === r.user; });
            return {
              id: nextId++,
              user: r.user,
              nombre: r.nombre || r.user,
              rol: r.rol || 'user',
              puntuacion: pts ? pts.puntuacion : 0,
              monedas: r.monedas || 500
            };
          });

        // Actualizamos puntuaciones en los usuarios de la base JSON
        var baseConPuntuaciones = usuariosBase.map(function(u) {
          var pts = puntuaciones.find(function(p) { return p.user === u.user; });
          return Object.assign({}, u, {
            puntuacion: pts ? pts.puntuacion : (u.puntuacion || 0)
          });
        });

        // Combinamos y guardamos en caché
        var lista = baseConPuntuaciones.concat(registradosFormateados);
        guardarEnCache(lista);
        resolve(lista);
      })
      .catch(reject);
  });
}

/**
 * Actualiza los campos de un usuario identificado por su ID.
 * @param {number} id       - ID del usuario a modificar
 * @param {Object} cambios  - Objeto con los campos a actualizar
 * @returns {Promise<Object>} Promesa que resuelve con el usuario actualizado
 */
function actualizarUsuario(id, cambios) {
  return obtenerTodosLosUsuarios().then(function(lista) {
    var idx = lista.findIndex(function(u) { return u.id === id; });
    if (idx === -1) throw new Error('Usuario con ID ' + id + ' no encontrado');
    lista[idx] = Object.assign({}, lista[idx], cambios);
    guardarEnCache(lista);
    return lista[idx];
  });
}

/**
 * Elimina un usuario por su ID.
 * También elimina al usuario de "usuarios_registrados" si existe ahí.
 * @param {number} id - ID del usuario a eliminar
 * @returns {Promise<Array>} Promesa que resuelve con la lista actualizada
 */
function borrarUsuario(id) {
  return obtenerTodosLosUsuarios().then(function(lista) {
    var usuario = lista.find(function(u) { return u.id === id; });
    if (!usuario) throw new Error('Usuario con ID ' + id + ' no encontrado');

    // Eliminar del panel
    var nuevaLista = lista.filter(function(u) { return u.id !== id; });
    guardarEnCache(nuevaLista);

    // Sincronizar con usuarios_registrados para mantener consistencia
    var registrados     = leerUsuariosRegistrados();
    var nuevosRegistr   = registrados.filter(function(r) { return r.user !== usuario.user; });
    localStorage.setItem('usuarios_registrados', JSON.stringify(nuevosRegistr));

    return nuevaLista;
  });
}

// ==============================
// 3. VARIABLES DE ESTADO
// ==============================
var dtTabla     = null;  // Instancia activa de DataTables
var chartGrafica = null; // Instancia activa de Chart.js
var usuariosData = [];   // Caché en memoria (sincronizada con localStorage)

// ==============================
// 4. INICIALIZACIÓN
// ==============================
document.addEventListener('DOMContentLoaded', function() {

  // --- Comprobación de acceso admin ---
  // Se verifica que exista sesión y que el rol sea "admin"
  var sesion = getSesion();
  if (!sesion || String(sesion.rol).toLowerCase() !== 'admin') {
    alert('⛔ Acceso denegado. Solo los administradores pueden acceder al panel.');
    window.location.href = '../index.html';
    return;
  }

  // Mostrar nombre y avatar del admin en el navbar
  var elNombre = document.getElementById('admin-nombre');
  var elAvatar = document.getElementById('admin-avatar');
  if (elNombre) elNombre.textContent = sesion.nombre || sesion.user;
  if (elAvatar && sesion.avatar) elAvatar.src = sesion.avatar;

  // Botón "Cerrar Sesión"
  var btnLogout = document.getElementById('btn-logout-admin');
  if (btnLogout) {
    btnLogout.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('session');
      window.location.href = '../index.html';
    });
  }

  // Botón "Recargar datos" – invalida la caché y vuelve a cargar
  var btnRecargar = document.getElementById('btn-recargar');
  if (btnRecargar) {
    btnRecargar.addEventListener('click', function() {
      localStorage.removeItem(ADMIN_KEY);
      iniciarPanel();
    });
  }

  // Handler del formulario de edición (submit)
  var frmEditar = document.getElementById('frm-editar');
  if (frmEditar) frmEditar.addEventListener('submit', onGuardarEdicion);

  // Cargar datos y renderizar tabla + gráfica
  iniciarPanel();
});

/**
 * Carga los datos con fetch (Promesa), actualiza las estadísticas,
 * renderiza la DataTable y la gráfica.
 */
function iniciarPanel() {
  mostrarSpinner(true);

  // Usamos fetch + Promesa para obtener la lista de usuarios
  obtenerTodosLosUsuarios()
    .then(function(usuarios) {
      usuariosData = usuarios;

      // Actualizar tarjetas de estadísticas
      actualizarEstadisticas(usuarios);

      // Renderizar tabla y gráfica
      renderizarTabla(usuarios);
      renderizarGrafica(usuarios);

      mostrarSpinner(false);
    })
    .catch(function(err) {
      console.error('Error al cargar usuarios:', err);
      mostrarSpinner(false);
      mostrarAlerta('❌ Error al cargar los datos: ' + err.message);
    });
}

/**
 * Actualiza las tarjetas de estadísticas (total, mejor puntuación, media).
 * @param {Array} usuarios
 */
function actualizarEstadisticas(usuarios) {
  var elTotal = document.getElementById('total-usuarios');
  var elMejor = document.getElementById('mejor-puntuacion');
  var elMedia = document.getElementById('media-puntuacion');

  if (elTotal) elTotal.textContent = usuarios.length;

  var puntuaciones = usuarios.map(function(u) { return u.puntuacion || 0; });
  var mejor = puntuaciones.length ? Math.max.apply(null, puntuaciones) : 0;
  var media = puntuaciones.length
    ? Math.round(puntuaciones.reduce(function(a, b) { return a + b; }, 0) / puntuaciones.length)
    : 0;

  if (elMejor) elMejor.textContent = mejor + ' pts';
  if (elMedia) elMedia.textContent = media + ' pts';
}

// ==============================
// 5. DATATABLE
// ==============================

/**
 * Inicializa (o reinicializa) la tabla DataTables con la lista de usuarios.
 * Usa la integración Bootstrap 5 de DataTables.
 * @param {Array} usuarios
 */
function renderizarTabla(usuarios) {
  // Destruir instancia previa si existe para evitar duplicados
  if (dtTabla) {
    dtTabla.destroy();
    dtTabla = null;
    $('#tabla-usuarios tbody').empty();
  }

  // Inicializar DataTables con los datos en JSON
  dtTabla = $('#tabla-usuarios').DataTable({
    data: usuarios,
    destroy: true,
    // Definición de columnas: mapeadas a las claves del objeto JSON
    columns: [
      { data: 'id',         title: 'ID Alumno'                          },
      { data: 'nombre',     title: 'Nombre Alumno', defaultContent: ''  },
      { data: 'user',       title: 'Usuario'                            },
      { data: 'puntuacion', title: 'Puntuación',    defaultContent: 0   },
      { data: 'rol',        title: 'Rol',           defaultContent: 'user' },
      {
        // Columna de acciones: botones Editar y Eliminar generados via render
        data: null,
        title: 'Acciones',
        orderable: false,
        className: 'text-center dt-acciones',
        render: function(data, type, row) {
          return '<button class="btn btn-sm btn-warning me-1 btn-editar" data-id="' + row.id + '" title="Editar usuario">✏️ Editar</button>' +
                 '<button class="btn btn-sm btn-danger btn-eliminar" data-id="' + row.id + '" title="Eliminar usuario">🗑️ Eliminar</button>';
        }
      }
    ],
    // Traducción al español (inline para evitar dependencia de CDN externo)
    language: {
      decimal:        ',',
      emptyTable:     'No hay datos de usuarios disponibles',
      info:           'Mostrando _START_ a _END_ de _TOTAL_ registros',
      infoEmpty:      'Mostrando 0 a 0 de 0 registros',
      infoFiltered:   '(filtrado de _MAX_ registros totales)',
      lengthMenu:     'Mostrar _MENU_ registros',
      loadingRecords: 'Cargando...',
      processing:     'Procesando...',
      search:         'Buscar:',
      zeroRecords:    'No se encontraron resultados',
      paginate: {
        first:    'Primero',
        last:     'Último',
        next:     'Siguiente',
        previous: 'Anterior'
      }
    },
    pageLength: 10,
    order: [[0, 'asc']] // Ordenar por ID de forma ascendente
  });

  // Delegación de eventos para los botones generados dinámicamente
  // (necesario porque DataTables regenera las filas al paginar/filtrar)
  $('#tabla-usuarios')
    .off('click', '.btn-editar')
    .on('click', '.btn-editar', function() {
      var id = parseInt($(this).data('id'), 10);
      abrirModalEditar(id);
    });

  $('#tabla-usuarios')
    .off('click', '.btn-eliminar')
    .on('click', '.btn-eliminar', function() {
      var id = parseInt($(this).data('id'), 10);
      confirmarEliminar(id);
    });
}

// ==============================
// 6. MODAL DE EDICIÓN
// ==============================

/**
 * Abre el modal de edición y rellena los campos con los datos del usuario.
 * @param {number} id - ID del usuario a editar
 */
function abrirModalEditar(id) {
  var usuario = usuariosData.find(function(u) { return u.id === id; });
  if (!usuario) return;

  // Rellenar los campos del formulario con los valores actuales
  document.getElementById('edit-id').value         = usuario.id;
  document.getElementById('edit-nombre').value     = usuario.nombre || usuario.user || '';
  document.getElementById('edit-puntuacion').value = usuario.puntuacion || 0;
  document.getElementById('edit-rol').value        = usuario.rol || 'user';
  document.getElementById('edit-monedas').value    = usuario.monedas || 0;

  // Mostrar el modal Bootstrap
  var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-editar'));
  modal.show();
}

/**
 * Handler del submit del formulario de edición.
 * Usa actualizarUsuario() (Promesa) para guardar los cambios.
 * @param {Event} e
 */
function onGuardarEdicion(e) {
  e.preventDefault();

  var id = parseInt(document.getElementById('edit-id').value, 10);
  var cambios = {
    nombre:     document.getElementById('edit-nombre').value.trim(),
    puntuacion: parseInt(document.getElementById('edit-puntuacion').value, 10) || 0,
    rol:        document.getElementById('edit-rol').value,
    monedas:    parseInt(document.getElementById('edit-monedas').value, 10) || 0
  };

  // Guardamos via Promesa (simula una petición asíncrona al servidor)
  actualizarUsuario(id, cambios)
    .then(function(usuarioActualizado) {
      // Actualizar caché en memoria
      var idx = usuariosData.findIndex(function(u) { return u.id === id; });
      if (idx !== -1) usuariosData[idx] = usuarioActualizado;

      // Refrescar tabla, gráfica y estadísticas
      actualizarEstadisticas(usuariosData);
      renderizarTabla(usuariosData);
      renderizarGrafica(usuariosData);

      // Cerrar el modal
      var modalInst = bootstrap.Modal.getInstance(document.getElementById('modal-editar'));
      if (modalInst) modalInst.hide();

      mostrarToast('✅ Usuario actualizado correctamente');
    })
    .catch(function(err) {
      console.error('Error al editar usuario:', err);
      mostrarAlerta('❌ Error al guardar los cambios: ' + err.message);
    });
}

/**
 * Pide confirmación al usuario y elimina el registro si confirma.
 * @param {number} id - ID del usuario a eliminar
 */
function confirmarEliminar(id) {
  var usuario = usuariosData.find(function(u) { return u.id === id; });
  if (!usuario) return;

  // Impedir que el admin elimine su propia cuenta
  var sesion = getSesion();
  if (sesion && sesion.user === usuario.user) {
    mostrarAlerta('⚠️ No puedes eliminar tu propia cuenta de administrador.');
    return;
  }

  if (!confirm('¿Eliminar al usuario "' + (usuario.nombre || usuario.user) + '"?\nEsta acción no se puede deshacer.')) {
    return;
  }

  // Borrar via Promesa
  borrarUsuario(id)
    .then(function(nuevaLista) {
      usuariosData = nuevaLista;

      // Refrescar tabla, gráfica y estadísticas
      actualizarEstadisticas(nuevaLista);
      renderizarTabla(nuevaLista);
      renderizarGrafica(nuevaLista);

      mostrarToast('🗑️ Usuario eliminado correctamente');
    })
    .catch(function(err) {
      console.error('Error al eliminar usuario:', err);
      mostrarAlerta('❌ Error al eliminar: ' + err.message);
    });
}

// ==============================
// 7. GRÁFICA (Chart.js)
// ==============================

/**
 * Renderiza la gráfica de barras de puntuaciones con Chart.js.
 * El título incluye el número total de usuarios en la base de datos.
 * @param {Array} usuarios
 */
function renderizarGrafica(usuarios) {
  var canvas = document.getElementById('grafica-usuarios');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  // Destruir instancia anterior para evitar conflictos
  if (chartGrafica) {
    chartGrafica.destroy();
    chartGrafica = null;
  }

  var etiquetas    = usuarios.map(function(u) { return u.nombre || u.user; });
  var puntuaciones = usuarios.map(function(u) { return u.puntuacion || 0; });

  // Generamos colores HSL distintos para cada barra
  var coloresFondo = usuarios.map(function(_, i) {
    return 'hsla(' + ((i * 47 + 200) % 360) + ', 70%, 55%, 0.85)';
  });
  var coloresBorde = usuarios.map(function(_, i) {
    return 'hsl(' + ((i * 47 + 200) % 360) + ', 70%, 38%)';
  });

  // Creamos la gráfica de barras
  chartGrafica = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Puntuación',
        data: puntuaciones,
        backgroundColor: coloresFondo,
        borderColor:     coloresBorde,
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        // El título muestra tanto el nº de usuarios como el concepto
        title: {
          display: true,
          text: 'Puntuaciones de usuarios (total: ' + usuarios.length + ' en la base de datos)',
          font: { size: 15, weight: 'bold' }
        },
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function(ctx) { return 'Puntuación: ' + ctx.raw + ' pts'; }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Puntuación (pts)' }
        },
        x: {
          title: { display: true, text: 'Usuarios' }
        }
      }
    }
  });
}

// ==============================
// 8. UTILIDADES DE UI
// ==============================

/** Muestra u oculta el spinner de carga */
function mostrarSpinner(visible) {
  var el = document.getElementById('spinner-carga');
  if (el) el.classList.toggle('d-none', !visible);
}

/**
 * Muestra un toast de notificación temporal (desaparece en 3 s).
 * @param {string} mensaje
 */
function mostrarToast(mensaje) {
  var toastEl   = document.getElementById('toast-notif');
  var toastBody = document.getElementById('toast-body');
  if (!toastEl || !toastBody) return;
  toastBody.textContent = mensaje;
  new bootstrap.Toast(toastEl, { delay: 3000 }).show();
}

/**
 * Muestra un mensaje de error inline durante 5 segundos.
 * @param {string} mensaje
 */
function mostrarAlerta(mensaje) {
  var el = document.getElementById('alerta-panel');
  if (!el) { alert(mensaje); return; }
  el.textContent = mensaje;
  el.classList.remove('d-none');
  setTimeout(function() { el.classList.add('d-none'); }, 5000);
}

// =======================
// VARIABLES GLOBALES - USUARIOS
// =======================

// Instancia de la tabla de usuarios (DataTables)
let tablaUsuarios = null;
// Instancias de los gráficos Chart.js
let chartTipos = null;
let chartPuntuacion = null;
// Instancias de los modales de edición y agregado de usuarios
let editModal = null;
let addModal = null;
// Array principal de usuarios cargados de la base de datos
let usuarios = [];

// =======================
// VARIABLES GLOBALES - JUEGOS
// =======================

// Objeto con datos de juegos cargados de juegos.json
let datosJuegos = null;
// Instancia de la DataTable para la tabla de juegos
let tablaJuegosInstancia = null;

// =======================================
// FUNCIONES FETCH PARA BASE DE DATOS
// =======================================

/**
 * Obtiene la lista de usuarios desde la base de datos
 * @returns {Promise<Array>} Lista de usuarios
 */
function fetchUsuarios() {
  return fetch('../php/usuarios-lista.php')
    .then(res => {
      if (!res.ok) throw new Error('Error al cargar usuarios');
      return res.json();
    });
}

/**
 * Crea un nuevo usuario en la base de datos
 * @param {FormData} formData Datos del usuario
 * @returns {Promise<Object>} Respuesta del servidor
 */
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

/**
 * Actualiza un usuario en la base de datos
 * @param {FormData} formData Datos del usuario
 * @returns {Promise<Object>} Respuesta del servidor
 */
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

/**
 * Elimina un usuario de la base de datos
 * @param {string} usuario Nombre del usuario a eliminar
 * @returns {Promise<Object>} Respuesta del servidor
 */
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

// ===========================================
// GRAFICO DONUT DE TIPOS DE USUARIO (Chart.js)
// ===========================================

/**
 * Renderiza un gráfico tipo donut que muestra el número de usuarios por tipo.
 * @param {Array} lista Lista de usuarios
 */
function renderGraficoTipos(lista) {
  const conteo = {};
  lista.forEach(u => {
    const tipo = u.tipo || "jugador";
    conteo[tipo] = (conteo[tipo] || 0) + 1;
  });

  if (chartTipos) chartTipos.destroy();

  const ctx = document.getElementById("grafico-usuarios").getContext("2d");
  chartTipos = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(conteo),
      datasets: [{
        label: "Usuarios por tipo",
        data: Object.values(conteo),
        backgroundColor: ["#0d6efd", "#20c997", "#fd7e14", "#dc3545"],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// ==================================================
// GRAFICO BARRAS DE PUNTUACION DE USUARIOS (Chart.js)
// ==================================================

/**
 * Renderiza un gráfico de barras ordenado por puntuación de usuarios.
 * @param {Array} lista Lista de usuarios
 */
function renderGraficoPuntuaciones(lista) {
  const ordenados = [...lista].sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0));
  const nombres = ordenados.map(u => u.usuario);
  const puntos = ordenados.map(u => u.puntuacion ?? 0);

  if (chartPuntuacion) chartPuntuacion.destroy();

  const ctx = document.getElementById("grafico-puntuaciones").getContext("2d");
  chartPuntuacion = new Chart(ctx, {
    type: "bar",
    data: {
      labels: nombres,
      datasets: [{
        label: `Puntuación (${lista.length} usuarios)`,
        data: puntos,
        backgroundColor: "rgba(13, 110, 253, 0.7)",
        borderColor: "#0d6efd",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// =======================================================
//        DATATABLE DE LA LISTA DE USUARIOS
// =======================================================

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
  return intereses.length ? intereses.join(' ') : '<span class="text-muted">-</span>';
}

/**
 * Formatea la fecha para mostrar
 * @param {string} fecha Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
  if (!fecha) return '-';
  const partes = fecha.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fecha;
}

/**
 * Formatea el género para mostrar
 * @param {string} genero Género
 * @returns {string} Género formateado
 */
function formatearGenero(genero) {
  const generos = {
    'masculino': 'Masculino',
    'femenino': 'Femenino',
    'no-decirlo': 'No especificado'
  };
  return generos[genero] || genero;
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
 * Renderiza la tabla interactiva de usuarios usando DataTables.
 * @param {Array} lista Lista de usuarios
 */
function renderTablaUsuarios(lista) {
  const data = lista.map((u, i) => ({
    index: i + 1,
    usuario: u.usuario,
    email: u.email,
    telefono: u.telefono || '-',
    fecha: formatearFecha(u.fecha),
    genero: formatearGenero(u.genero),
    rol: formatearFrecuencia(u.rol),
    intereses: formatearIntereses(u),
    tipo: u.tipo || 'usuario',
    puntuacion: u.puntuacion ?? 0,
    rawData: u // Guardamos los datos originales para edición
  }));

  if (tablaUsuarios) {
    tablaUsuarios.clear();
    tablaUsuarios.rows.add(data).draw();
    return;
  }

  tablaUsuarios = $("#tabla-usuarios").DataTable({
    data,
    responsive: true,
    language: { url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json" },
    columns: [
      { data: "index", title: "#", width: "40px" },
      { data: "usuario", title: "Usuario" },
      { data: "email", title: "Email" },
      { data: "telefono", title: "Teléfono", width: "100px" },
      { data: "fecha", title: "Fecha Nac.", width: "100px" },
      { data: "genero", title: "Género", width: "100px" },
      { data: "rol", title: "Frecuencia", width: "110px" },
      { data: "intereses", title: "Intereses", orderable: false },
      { 
        data: "tipo", 
        title: "Tipo", 
        width: "80px",
        render: function(data) {
          const badgeClass = data === 'admin' ? 'bg-danger' : 'bg-primary';
          return `<span class="badge ${badgeClass}">${data}</span>`;
        }
      },
      { data: "puntuacion", title: "Puntuación", width: "90px" },
      {
        data: null,
        title: "Acciones",
        orderable: false,
        width: "160px",
        render: function (row) {
          return `
            <button class="btn btn-sm btn-warning editar-usuario me-1" data-usuario="${row.usuario}">Editar</button>
            <button class="btn btn-sm btn-danger eliminar-usuario" data-usuario="${row.usuario}">Eliminar</button>
          `;
        }
      }
    ]
  });

  // Evento para el botón de editar usuario
  $("#tabla-usuarios").off("click", ".editar-usuario").on("click", ".editar-usuario", function () {
    const usuario = $(this).data("usuario");
    const fila = usuarios.find(r => r.usuario === usuario);
    if (!fila) return;

    // Llenar el formulario de edición
    $("#edit-usuario-original").val(fila.usuario);
    $("#edit-usuario").val(fila.usuario);
    $("#edit-email").val(fila.email);
    $("#edit-telefono").val(fila.telefono || '');
    $("#edit-fecha").val(fila.fecha || '');
    $("#edit-genero").val(fila.genero || 'no-decirlo');
    $("#edit-rol").val(fila.rol || 'a-diario');
    $("#edit-tipo").val(fila.tipo || 'jugador');
    $("#edit-puntuacion").val(fila.puntuacion || 0);
    $("#edit-password").val('');

    // Intereses (checkboxes)
    $("#edit-estrategia").prop('checked', parseInt(fila.juego_estrategia) === 1);
    $("#edit-accion").prop('checked', parseInt(fila.juego_accion) === 1);
    $("#edit-rpg").prop('checked', parseInt(fila.juego_rpg) === 1);
    $("#edit-puzzle").prop('checked', parseInt(fila.juego_puzzle) === 1);
    $("#edit-carreras").prop('checked', parseInt(fila.juego_carreras) === 1);

    editModal?.show();
  });

  // Evento para el botón de eliminar usuario
  $("#tabla-usuarios").off("click", ".eliminar-usuario").on("click", ".eliminar-usuario", function () {
    const usuario = $(this).data("usuario");
    if (!confirm(`¿Eliminar al usuario "${usuario}"?\n\nEsta acción no se puede deshacer.`)) return;

    fetchEliminarUsuario(usuario)
      .then(data => {
        if (data.success) {
          alert('Usuario eliminado correctamente');
          cargarUsuarios();
        } else {
          alert('Error: ' + (data.message || 'No se pudo eliminar el usuario'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error al eliminar el usuario');
      });
  });
}

// ================================================================
// FUNCIÓN PRINCIPAL PARA CARGAR Y MOSTRAR USUARIOS
// ================================================================

/**
 * Carga los usuarios desde la base de datos y actualiza la interfaz
 */
function cargarUsuarios() {
  fetchUsuarios()
    .then(data => {
      usuarios = data;
      document.getElementById("total-usuarios-badge").textContent = usuarios.length;
      renderGraficoTipos(usuarios);
      renderGraficoPuntuaciones(usuarios);
      renderTablaUsuarios(usuarios);
    })
    .catch(err => {
      console.error('Error cargando usuarios:', err);
      alert('Error al cargar los usuarios desde la base de datos');
    });
}

// ============================================================
// FUNCIONES PARA LA GESTIÓN DE JUEGOS
// ============================================================

/**
 * Carga los datos de juegos desde un archivo JSON.
 */
function cargarDatosJuegos() {
  return fetch('../../components/juegos.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudo cargar juegos.json: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      datosJuegos = data;
      console.log('Juegos cargados correctamente');
      return data;
    })
    .catch(error => {
      console.error('Error cargando juegos:', error);
      return fetch('juegos.json')
        .then(r => r.json())
        .then(data => {
          datosJuegos = data;
          return data;
        })
        .catch(e => {
          console.error('También falló ruta alternativa:', e);
        });
    });
}

/**
 * Muestra la tabla de juegos de acuerdo al tipo seleccionado en el filtro.
 */
function mostrarTablaJuegos() {
  const tipoSeleccionado = document.getElementById('filtro-tipo-juego').value;
  const tabla = document.getElementById('tabla-juegos');
  const mensaje = document.getElementById('mensaje-seleccion-juegos');

  if (!tipoSeleccionado) {
    tabla.style.display = 'none';
    mensaje.style.display = 'block';
    if (tablaJuegosInstancia) {
      tablaJuegosInstancia.destroy();
      tablaJuegosInstancia = null;
    }
    return;
  }

  if (!datosJuegos || !datosJuegos.tiposDeJuego) {
    console.error('No hay datos de juegos cargados');
    alert('Error: No se pudieron cargar los datos de juegos');
    return;
  }

  mensaje.style.display = 'none';
  tabla.style.display = 'table';

  const juegos = datosJuegos.tiposDeJuego[tipoSeleccionado];
  
  if (!juegos) {
    console.error('Tipo de juego no encontrado:', tipoSeleccionado);
    return;
  }

  const datosTabla = [];
  
  juegos.forEach(juego => {
    juego.jugadores.forEach((jugador, index) => {
      datosTabla.push({
        juego: index === 0 ? juego.nombre : '',
        jugador: jugador.nombre,
        edadJugador: jugador.edad,
        puntuacion: jugador.puntuacion,
        edadRecomendada: index === 0 ? juego.edadRecomendada + '+' : '',
        categoria: index === 0 ? juego.categoria : '',
        esPrimeraFila: index === 0,
        totalFilas: juego.jugadores.length
      });
    });
  });

  if (tablaJuegosInstancia) {
    tablaJuegosInstancia.destroy();
  }

  tablaJuegosInstancia = $('#tabla-juegos').DataTable({
    data: datosTabla,
    responsive: true,
    language: { 
      url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json",
      emptyTable: "No hay datos disponibles"
    },
    columns: [
      { 
        data: 'juego',
        title: 'Juego',
        render: function(data, type, row) {
          if (row.esPrimeraFila && data) {
            return `<strong style="background: #e9ecef; padding: 5px 10px; border-radius: 5px; display: inline-block;">${data}</strong>`;
          }
          return data;
        }
      },
      { data: 'jugador', title: 'Jugador' },
      { data: 'edadJugador', title: 'Edad Jugador', render: data => data + ' años' },
      { 
        data: 'puntuacion', 
        title: 'Puntuación',
        render: data => `<span class="fw-bold text-primary">${data} pts</span>`
      },
      { 
        data: 'edadRecomendada', 
        title: 'Edad Recomendada',
        render: function(data, type, row) {
          if (row.esPrimeraFila && data) {
            return `<span class="badge bg-secondary">${data}</span>`;
          }
          return data;
        }
      },
      { 
        data: 'categoria', 
        title: 'Categoría',
        render: function(data, type, row) {
          if (row.esPrimeraFila && data) {
            const badgeClass = data === 'estrategia' ? 'badge-estrategia' : 'badge-familiar';
            return `<span class="badge ${badgeClass} badge-categoria">${data}</span>`;
          }
          return data;
        }
      }
    ],
    order: [],
    createdRow: function(row, data, dataIndex) {
      if (!data.esPrimeraFila) {
        $(row).addClass('jugador-row');
      }
    }
  });
}

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

  // Botón para abrir el formulario de agregar usuario
  document.getElementById("btn-add-user")?.addEventListener("click", () => {
    document.getElementById("addUserForm").reset();
    addModal?.show();
  });

  // Evento submit para agregar usuario
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

  // Evento submit para editar usuario
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

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
// Array principal de usuarios cargados del archivo usuarios.json
let usuarios = [];

// =======================
// VARIABLES GLOBALES - JUEGOS
// =======================

// Objeto con datos de juegos cargados de juegos.json
let datosJuegos = null;
// Instancia de la DataTable para la tabla de juegos
let tablaJuegosInstancia = null;

// =======================================
// FUNCION AUXILIAR PARA PEDIR EL JSON
// =======================================

/**
 * Realiza una petición fetch y regresa el JSON de un archivo.
 * Lanza error si la petición falla.
 */
function getJson(url) {
  return fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`No se pudo cargar ${url}: ${res.status}`);
      }
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
  // Contar usuarios por tipo
  const conteo = {};
  lista.forEach(u => {
    const tipo = u.tipo || "jugador";
    conteo[tipo] = (conteo[tipo] || 0) + 1;
  });

  // Destruye el gráfico existente si lo hay, para evitar superposición
  if (chartTipos) chartTipos.destroy();

  // Crea el nuevo gráfico tipo doughnut usando Chart.js
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
      plugins: { legend: { position: "bottom" } }
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
  // Ordena los usuarios de mayor a menor puntuación
  const ordenados = [...lista].sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0));
  const nombres = ordenados.map(u => u.usuario);
  const puntos = ordenados.map(u => u.puntuacion ?? 0);

  // Destruye el gráfico anterior si lo hay
  if (chartPuntuacion) chartPuntuacion.destroy();

  // Crea el gráfico de barras
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
      scales: { y: { beginAtZero: true } }
    }
  });
}

// =======================================================
//        DATATABLE DE LA LISTA DE USUARIOS
// =======================================================

/**
 * Renderiza la tabla interactiva de usuarios usando DataTables.
 * Permite editar y eliminar usuarios desde la tabla.
 * @param {Array} lista Lista de usuarios
 */
function renderTablaUsuarios(lista) {
  // Prepara los datos para la tabla
  const data = lista.map((u, i) => ({
    index: i + 1,
    idAlumno: u.idAlumno ?? "—",
    usuario: u.usuario,
    tipo: u.tipo,
    puntuacion: u.puntuacion ?? 0
  }));

  // Si ya existe una tabla renderizada, la refresca con los nuevos datos
  if (tablaUsuarios) {
    tablaUsuarios.clear();
    tablaUsuarios.rows.add(data).draw();
    return;
  }

  // Inicializa la DataTable
  tablaUsuarios = $("#tabla-usuarios").DataTable({
    data,
    responsive: true,
    language: { url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json" },
    columns: [
      { data: "index", title: "#", width: "40px" },
      { data: "idAlumno", title: "ID Alumno", width: "80px" },
      { data: "usuario", title: "Usuario" },
      { data: "puntuacion", title: "Puntuación", width: "100px" },
      { data: "tipo", title: "Tipo", width: "100px" },
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

    $("#edit-usuario-hidden").val(fila.usuario);
    $("#edit-usuario").val(fila.usuario);
    $("#edit-tipo").val(fila.tipo);
    $("#edit-puntuacion").val(fila.puntuacion);

    editModal?.show();
  });

  // Evento para el botón de eliminar usuario
  $("#tabla-usuarios").off("click", ".eliminar-usuario").on("click", ".eliminar-usuario", function () {
    const usuario = $(this).data("usuario");
    if (!confirm(`¿Eliminar al usuario "${usuario}"?`)) return;
    usuarios = usuarios.filter(u => u.usuario !== usuario);
    recargarPanel();
  });
}

// ================================================================
// FUNCIÓN PRINCIPAL PARA REFRESCAR DATOS Y GRAFICOS DEL PANEL
// ================================================================

/**
 * Actualiza el panel de usuarios mostrando la cantidad total, gráficos y tabla.
 */
function recargarPanel() {
  document.getElementById("total-usuarios-badge").textContent = usuarios.length;
  renderGraficoTipos(usuarios);
  renderGraficoPuntuaciones(usuarios);
  renderTablaUsuarios(usuarios);
}

// ============================================================
// FUNCIONES PARA LA GESTIÓN DE JUEGOS
// ============================================================

/**
 * Carga los datos de juegos desde un archivo JSON.
 * Intenta primero desde ../components/juegos.json y si falla, prueba juegos.json en el mismo directorio.
 * Almacena el resultado en la variable global datosJuegos.
 */
function cargarDatosJuegos() {
  return fetch('../components/juegos.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudo cargar juegos.json: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      datosJuegos = data;
      console.log('Juegos cargados correctamente desde components/juegos.json');
      return data;
    })
    .catch(error => {
      console.error('Error cargando juegos:', error);
      // Si falla, intenta cargar desde una ruta alternativa
      return fetch('juegos.json')
        .then(r => r.json())
        .then(data => {
          datosJuegos = data;
          console.log('Juegos cargados desde ruta alternativa');
          return data;
        })
        .catch(e => {
          console.error('También falló ruta alternativa:', e);
        });
    });
}

/**
 * Muestra la tabla de juegos de acuerdo al tipo seleccionado en el filtro.
 * Permite visualizar jugadores, puntuaciones y detalles del juego.
 */
function mostrarTablaJuegos() {
  const tipoSeleccionado = document.getElementById('filtro-tipo-juego').value;
  const tabla = document.getElementById('tabla-juegos');
  const mensaje = document.getElementById('mensaje-seleccion-juegos');

  // Si no se ha seleccionado ningún tipo de juego
  if (!tipoSeleccionado) {
    tabla.style.display = 'none';
    mensaje.style.display = 'block';
    if (tablaJuegosInstancia) {
      tablaJuegosInstancia.destroy();
      tablaJuegosInstancia = null;
    }
    return;
  }

  // Validar que los datos de juegos estén cargados
  if (!datosJuegos || !datosJuegos.tiposDeJuego) {
    console.error('No hay datos de juegos cargados');
    alert('Error: No se pudieron cargar los datos de juegos');
    return;
  }

  // Mostrar la tabla y ocultar el mensaje
  mensaje.style.display = 'none';
  tabla.style.display = 'table';

  // Obtener los juegos del tipo seleccionado
  const juegos = datosJuegos.tiposDeJuego[tipoSeleccionado];
  
  if (!juegos) {
    console.error('Tipo de juego no encontrado:', tipoSeleccionado);
    return;
  }

  // Preparar los datos para la DataTable
  const datosTabla = [];
  
  juegos.forEach(juego => {
    juego.jugadores.forEach((jugador, index) => {
      datosTabla.push({
        // ALL DATOS
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

  // Destruir la tabla anterior si existe
  if (tablaJuegosInstancia) {
    tablaJuegosInstancia.destroy();
  }

  // Inicializar la DataTable de juegos
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
            // juego resaltado
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
      // Marca las filas de jugador con una clase
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
  // Inicializa los modales de Bootstrap para editar/agregar usuarios
  if (window.bootstrap?.Modal) {
    editModal = new bootstrap.Modal(document.getElementById("editUserModal"));
    addModal = new bootstrap.Modal(document.getElementById("addUserModal"));
  }

  // Carga el listado de usuarios al iniciar
  getJson("usuarios.json")
    .then(data => {
      usuarios = data;
      recargarPanel();
    })
    .catch(e => {
      alert("No se pudo cargar usuarios.json: " + e.message);
      console.error(e);
    });

  // Carga los datos de juegos al iniciar
  cargarDatosJuegos();

  // ======================
  // EVENTOS DE USUARIOS
  // ======================

  // Botón para abrir el formulario de agregar usuario
  document.getElementById("btn-add-user")?.addEventListener("click", () => {
    document.getElementById("addUserForm").reset();
    addModal?.show();
  });

  // Evento submit para agregar usuario desde el formulario
  document.getElementById("addUserForm")?.addEventListener("submit", function (e) {
    e.preventDefault();
    const usuario = document.getElementById("add-usuario").value.trim();
    const tipo = document.getElementById("add-tipo").value;
    const puntuacion = parseInt(document.getElementById("add-puntuacion").value, 10) || 0;
    // Calcula el siguiente idAlumno correlativo
    const idAlumno = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.idAlumno || 0)) + 1 : 1;
    
    if (!usuario) return alert("Usuario es obligatorio");
    if (usuarios.some(u => u.usuario === usuario)) return alert("Usuario ya existe");
    
    usuarios.push({ idAlumno, usuario, tipo, puntuacion });
    addModal?.hide();
    recargarPanel();
  });

  // Evento submit para editar usuario usando jQuery
  $("#editUserForm").off("submit").on("submit", function (e) {
    e.preventDefault();
    const usuarioViejo = $("#edit-usuario-hidden").val();
    const usuarioNuevo = $("#edit-usuario").val().trim();
    const tipo = $("#edit-tipo").val();
    const puntuacion = parseInt($("#edit-puntuacion").val(), 10) || 0;
    
    if (!usuarioNuevo) {
      alert("El nombre de usuario no puede estar vacío");
      return;
    }
    if (usuarioNuevo !== usuarioViejo && usuarios.some(u => u.usuario === usuarioNuevo)) {
      alert("Ya existe un usuario con ese nombre");
      return;
    }
    
    // Actualiza los datos del usuario
    usuarios = usuarios.map(u =>
      u.usuario === usuarioViejo
        ? { ...u, usuario: usuarioNuevo, tipo, puntuacion }
        : u
    );
    editModal?.hide();
    recargarPanel();
  });

  // ======================
  // EVENTOS DE JUEGOS
  // ======================

  // Evento cuando cambia el tipo de juego seleccionado
  document.getElementById('filtro-tipo-juego')?.addEventListener('change', mostrarTablaJuegos);
});
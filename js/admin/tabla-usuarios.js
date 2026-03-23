// =======================================================
//        DATATABLE DE LA LISTA DE USUARIOS
// =======================================================

function formatearIntereses(u) {
  const intereses = [];
  if (parseInt(u.juego_estrategia)) intereses.push('<span class="badge bg-primary intereses-badge">Estrategia</span>');
  if (parseInt(u.juego_accion)) intereses.push('<span class="badge bg-danger intereses-badge">Acción</span>');
  if (parseInt(u.juego_rpg)) intereses.push('<span class="badge bg-success intereses-badge">RPG</span>');
  if (parseInt(u.juego_puzzle)) intereses.push('<span class="badge bg-warning intereses-badge">Puzzles</span>');
  if (parseInt(u.juego_carreras)) intereses.push('<span class="badge bg-info intereses-badge">Carreras</span>');
  return intereses.length ? intereses.join(' ') : '<span class="text-muted">-</span>';
}

function formatearFecha(fecha) {
  if (!fecha) return '-';
  const partes = fecha.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fecha;
}

function formatearGenero(genero) {
  const generos = {
    'masculino': 'Masculino',
    'femenino': 'Femenino',
    'no-decirlo': 'No especificado'
  };
  return generos[genero] || genero;
}

function formatearFrecuencia(rol) {
  const frecuencias = {
    'a-diario': 'A diario',
    'semanalmente': 'Semanalmente',
    'ocasionalmente': 'Ocasionalmente'
  };
  return frecuencias[rol] || rol;
}

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
    // Llenar el formulario de edición, igual que antes...
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

// FUNCIÓN PRINCIPAL PARA CARGAR Y MOSTRAR USUARIOS
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
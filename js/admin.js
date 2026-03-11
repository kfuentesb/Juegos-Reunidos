/**
 * admin.js — Lógica del Panel de Administración
 * ================================================
 * Funcionalidades principales:
 *  1. Verificación de acceso: solo usuarios con rol "admin" pueden cargar el panel.
 *     La comprobación se hace con fetch() a procesar.php (accion=estado).
 *
 *  2. DataTable (jQuery DataTables): muestra los datos de la tabla `alumnos` con:
 *       - ID Alumno   (idAlumno de la tabla alumnos)
 *       - Nombre Alumno (campo usuario/alumno)
 *       - Puntuación    (campo puntuacion de la tabla alumnos)
 *       - Acciones      (botones Editar / Eliminar)
 *     Los datos se obtienen mediante fetch() a usuarios-lista.php → JSON.
 *
 *  3. Gráficas (Chart.js):
 *       - Gráfica de tarta: distribución de usuarios por tipo (admin / jugador).
 *       - Gráfica de barras: puntuación de cada alumno.
 *     Ambas gráficas usan los mismos datos JSON obtenidos con fetch().
 *
 *  4. CRUD desde el frontend:
 *       - Crear usuario  → fetch() POST a usuarios-crear.php
 *       - Editar usuario → fetch() POST a usuarios-actualizar.php
 *       - Eliminar usuario → fetch() POST a usuarios-eliminar.php
 *     Todas las peticiones usan fetch() con promesas y devuelven JSON.
 */

/* ─────────────────────────────────────────────────────
   VARIABLES GLOBALES DE ESTADO
───────────────────────────────────────────────────── */
let tablaUsuarios   = null; // Instancia del DataTable (se crea una sola vez)
let chartTipos      = null; // Gráfica de tarta: usuarios por tipo
let chartPuntuacion = null; // Gráfica de barras: puntuaciones por alumno
let editModal       = null; // Instancia del modal Bootstrap "Editar"
let addModal        = null; // Instancia del modal Bootstrap "Crear"

/* ─────────────────────────────────────────────────────
   UTILIDADES FETCH
   Todas las peticiones al servidor se realizan con
   fetch() (promesas), nunca con XMLHttpRequest.
───────────────────────────────────────────────────── */

/**
 * postForm — Envía un POST con datos en formato application/x-www-form-urlencoded.
 * @param {string} url   - Endpoint PHP destino
 * @param {object} data  - Objeto clave/valor con los datos a enviar
 * @returns {Promise<object>} - Promesa que resuelve con el JSON de respuesta
 */
const postForm = async (url, data) => {
  const body = new URLSearchParams(data).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  return res.json(); // Parsea la respuesta JSON del servidor
};

/**
 * getJson — Obtiene datos JSON mediante GET.
 * @param {string} url - Endpoint PHP a consultar
 * @returns {Promise<any>} - Promesa que resuelve con los datos JSON
 */
const getJson = async (url) => {
  const res = await fetch(url);
  return res.json();
};

/* ─────────────────────────────────────────────────────
   INICIALIZACIÓN AL CARGAR EL DOM
───────────────────────────────────────────────────── */
window.addEventListener("DOMContentLoaded", () => {

  // Inicializar instancias de los modales Bootstrap
  if (window.bootstrap?.Modal) {
    editModal = new bootstrap.Modal(document.getElementById("editUserModal"));
    addModal  = new bootstrap.Modal(document.getElementById("addUserModal"));
  }

  /* --------------------------------------------------
     ABRIR MODAL "CREAR USUARIO"
  -------------------------------------------------- */
  document.getElementById("btn-add-user")?.addEventListener("click", () => {
    document.getElementById("addUserForm").reset();
    addModal?.show();
  });

  /* --------------------------------------------------
     SUBMIT "CREAR USUARIO"
     Envía los datos del formulario con fetch() (POST)
     a usuarios-crear.php y recibe la respuesta JSON.
  -------------------------------------------------- */
  document.getElementById("addUserForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Recogemos todos los campos del formulario de creación
    const payload = {
      usuario:    document.getElementById("add-usuario").value.trim(),
      email:      document.getElementById("add-email").value.trim(),
      tipo:       document.getElementById("add-tipo").value,       // admin / jugador
      rol:        document.getElementById("add-rol").value,        // frecuencia
      password:   document.getElementById("add-password").value,
      puntuacion: document.getElementById("add-puntuacion").value
    };

    // fetch() POST → usuarios-crear.php → JSON {success, message}
    const res = await postForm("../php/usuarios-crear.php", payload);
    if (res.success) {
      addModal?.hide();
      cargarPanelAdmin(); // Recarga tabla y gráficas con los datos actualizados
    } else {
      alert(res.message || "Error al crear usuario.");
    }
  });

  /* --------------------------------------------------
     VERIFICACIÓN DE ACCESO ADMIN
     ───────────────────────────────────────────────
     Se usa fetch() para consultar la sesión PHP y
     comprobar que el usuario logueado tiene rol "admin".
     Si no está logueado O su rol no es "admin", se
     muestra una alerta y se redirige al inicio.
     Solo cuando la verificación es correcta se carga
     el panel con cargarPanelAdmin().
  -------------------------------------------------- */
  postForm("/Juegos%20Reunidos/php/procesar.php", { accion: "estado" })
    .then((data) => {
      /**
       * data.loggedIn → true si hay sesión PHP activa
       * data.user.rol → rol del usuario (viene de `tipo` en la BD)
       *                 Se compara en minúsculas por seguridad.
       *
       * La verificación es correcta:
       *  - data.loggedIn debe ser true
       *  - data.user.rol debe ser exactamente "admin" (insensitive)
       * Si alguna condición falla → acceso denegado y redirección.
       */
      if (!data.loggedIn || (data.user?.rol || "").toLowerCase() !== "admin") {
        alert("Acceso restringido solo a administradores");
        window.location.href = "../index.html";
        return;
      }
      // Usuario verificado como admin → cargar el panel
      cargarPanelAdmin();
    })
    .catch(() => {
      // Error de red o del servidor → denegar acceso por seguridad
      alert("No se pudo verificar el acceso. Inténtelo de nuevo.");
      window.location.href = "../index.html";
    });
});

/* ─────────────────────────────────────────────────────
   CARGA DEL PANEL ADMIN
   Obtiene los datos de usuarios via fetch() JSON y
   llama a las funciones de renderizado.
───────────────────────────────────────────────────── */
async function cargarPanelAdmin() {
  try {
    /**
     * fetch() GET a usuarios-lista.php → devuelve array JSON con:
     * [{ idAlumno, usuario, email, rol, tipo, puntuacion }, …]
     * El JOIN en PHP incluye idAlumno de la tabla alumnos.
     */
    const usuarios = await getJson("../php/usuarios-lista.php");

    // Actualizar badge con el número total de usuarios en la BD
    const badge = document.getElementById("total-usuarios-badge");
    if (badge) badge.textContent = usuarios.length;

    // Renderizar las dos gráficas con Chart.js
    renderGraficoTipos(usuarios);
    renderGraficoPuntuaciones(usuarios);

    // Renderizar el DataTable con las columnas: #, ID Alumno, Nombre, Puntuación, Acciones
    renderTablaUsuarios(usuarios);
  } catch (err) {
    console.error("Error al cargar el panel de admin:", err);
    alert("Error al cargar los datos de usuarios.");
  }
}

/* ─────────────────────────────────────────────────────
   GRÁFICA 1: DISTRIBUCIÓN POR TIPO (tarta/doughnut)
   Muestra cuántos usuarios son "admin" y cuántos "jugador".
   Datos: campo `tipo` del JSON devuelto por usuarios-lista.php.
───────────────────────────────────────────────────── */
function renderGraficoTipos(usuarios) {
  // Contar usuarios agrupados por tipo (admin / jugador / …)
  const conteo = {};
  usuarios.forEach(u => {
    const tipo = u.tipo || "jugador";
    conteo[tipo] = (conteo[tipo] || 0) + 1;
  });

  const labels = Object.keys(conteo);
  const datos  = Object.values(conteo);
  const colores = ["#0d6efd", "#20c997", "#fd7e14", "#dc3545"];

  // Destruir gráfica anterior antes de crear una nueva (evita duplicados)
  if (chartTipos) chartTipos.destroy();

  const ctx = document.getElementById("grafico-usuarios").getContext("2d");
  chartTipos = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Usuarios por tipo",
        data: datos,
        backgroundColor: colores.slice(0, labels.length),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            // Mostrar porcentaje en el tooltip
            label: function(ctx) {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = total ? Math.round((ctx.parsed / total) * 100) : 0;
              return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/* ─────────────────────────────────────────────────────
   GRÁFICA 2: PUNTUACIONES POR ALUMNO (barras)
   Muestra la puntuación de cada alumno en la BD.
   Datos: campos `usuario` y `puntuacion` del JSON.
   El número de barras = nº de usuarios en la BD.
───────────────────────────────────────────────────── */
function renderGraficoPuntuaciones(usuarios) {
  // Ordenar de mayor a menor puntuación para mejor visualización
  const ordenados = [...usuarios].sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0));

  const nombres      = ordenados.map(u => u.usuario);
  const puntuaciones = ordenados.map(u => u.puntuacion ?? 0);

  // Destruir gráfica anterior antes de crear una nueva
  if (chartPuntuacion) chartPuntuacion.destroy();

  const ctx = document.getElementById("grafico-puntuaciones").getContext("2d");
  chartPuntuacion = new Chart(ctx, {
    type: "bar",
    data: {
      labels: nombres,
      datasets: [{
        label: `Puntuación (${usuarios.length} usuarios en BD)`,
        data: puntuaciones,
        backgroundColor: "rgba(13, 110, 253, 0.7)",
        borderColor: "#0d6efd",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

/* ─────────────────────────────────────────────────────
   DATATABLE: TABLA DE ALUMNOS
   ─────────────────────────────────────────────────────
   Columnas mostradas (datos de la tabla `alumnos` + `usuarios`):
     #             – número de fila
     ID Alumno     – idAlumno de la tabla alumnos
     Nombre Alumno – campo usuario (= alumno en la tabla alumnos)
     Puntuación    – puntuacion de la tabla alumnos
     Acciones      – botones Editar / Eliminar

   Si la tabla ya existe se actualiza con .clear().rows.add().draw()
   sin destruirla, para mantener el estado de paginación y filtros.
───────────────────────────────────────────────────── */
function renderTablaUsuarios(usuarios) {
  // Preparar el array de datos para DataTables
  const data = usuarios.map((u, i) => ({
    index:      i + 1,
    idAlumno:   u.idAlumno ?? "—",  // null si el usuario no tiene registro en alumnos
    usuario:    u.usuario,
    email:      u.email,            // Guardamos email para pre-rellenar el modal de edición
    tipo:       u.tipo,             // admin / jugador
    rol:        u.rol,              // frecuencia
    puntuacion: u.puntuacion ?? 0
  }));

  // Si la tabla ya existe, actualizamos solo los datos (sin reinicializar)
  if (tablaUsuarios) {
    tablaUsuarios.clear();
    tablaUsuarios.rows.add(data).draw();
    return;
  }

  // ── Primera inicialización del DataTable ──
  tablaUsuarios = $("#tabla-usuarios").DataTable({
    data,
    responsive: true,
    // Localización en español usando el CDN oficial de DataTables
    language: { url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json" },
    columns: [
      // Columna 1: número de fila (índice visual)
      { data: "index",      title: "#",             width: "40px" },
      // Columna 2: idAlumno de la tabla alumnos
      { data: "idAlumno",   title: "ID Alumno",      width: "80px" },
      // Columna 3: nombre del alumno (= usuario en la tabla usuarios)
      { data: "usuario",    title: "Nombre Alumno" },
      // Columna 4: puntuación del alumno (tabla alumnos)
      { data: "puntuacion", title: "Puntuación",     width: "100px" },
      // Columna 5: botones de acción (no ordenables)
      {
        data: null,
        title: "Acciones",
        orderable: false,
        width: "160px",
        // render recibe el objeto fila completo; usamos data-usuario para identificar al usuario
        render: function (row) {
          return `
            <button class="btn btn-sm btn-warning btn-admin editar-usuario me-1"
                    data-usuario="${row.usuario}">Editar</button>
            <button class="btn btn-sm btn-danger btn-admin eliminar-usuario"
                    data-usuario="${row.usuario}">Eliminar</button>
          `;
        }
      }
    ]
  });

  /* --------------------------------------------------
     EVENTO: CLICK EN "EDITAR"
     Usando delegación de eventos sobre #tabla-usuarios
     para que funcione con paginación (los botones en
     páginas no visibles no están en el DOM).
     fetch() no se usa aquí; solo pre-rellena el modal.
  -------------------------------------------------- */
  $("#tabla-usuarios").off("click", ".editar-usuario").on("click", ".editar-usuario", function () {
    const usuario = $(this).data("usuario");
    // Buscar la fila en el array interno de DataTables (incluye todas las páginas)
    const fila = tablaUsuarios.rows().data().toArray().find(r => r.usuario === usuario);
    if (!fila) return;

    // Pre-rellenar el modal de edición con los datos actuales del usuario
    $("#edit-usuario-hidden").val(fila.usuario);  // Campo oculto: identificador
    $("#edit-usuario").val(fila.usuario);          // Campo visible: solo lectura
    $("#edit-email").val(fila.email);
    $("#edit-tipo").val(fila.tipo);                // admin / jugador
    $("#edit-rol").val(fila.rol);                  // frecuencia de juego
    $("#edit-puntuacion").val(fila.puntuacion);

    editModal?.show();
  });

  /* --------------------------------------------------
     EVENTO: CLICK EN "ELIMINAR"
     Pide confirmación y luego envía fetch() POST a
     usuarios-eliminar.php con el nombre del usuario.
     La respuesta JSON indica si la operación fue exitosa.
  -------------------------------------------------- */
  $("#tabla-usuarios").off("click", ".eliminar-usuario").on("click", ".eliminar-usuario", async function () {
    const usuario = $(this).data("usuario");
    if (!confirm(`¿Seguro que deseas eliminar al alumno "${usuario}"?\nEsta acción no se puede deshacer.`)) return;

    // fetch() POST → usuarios-eliminar.php → JSON {success, message}
    const res = await postForm("../php/usuarios-eliminar.php", { usuario });
    if (res.success) {
      cargarPanelAdmin(); // Refresca tabla y gráficas tras eliminar
    } else {
      alert(res.message || "Error al eliminar usuario.");
    }
  });

  /* --------------------------------------------------
     EVENTO: SUBMIT "EDITAR USUARIO"
     Recoge los valores del formulario de edición y los
     envía con fetch() POST a usuarios-actualizar.php.
     La respuesta JSON indica éxito o mensaje de error.
  -------------------------------------------------- */
  $("#editUserForm").off("submit").on("submit", async function (e) {
    e.preventDefault();

    // Construir payload con los campos editables
    const payload = {
      usuario:    $("#edit-usuario-hidden").val(),  // Identificador (no editable)
      email:      $("#edit-email").val().trim(),
      tipo:       $("#edit-tipo").val(),             // admin / jugador
      rol:        $("#edit-rol").val(),              // frecuencia
      puntuacion: $("#edit-puntuacion").val()
    };

    // fetch() POST → usuarios-actualizar.php → JSON {success, message}
    const res = await postForm("../php/usuarios-actualizar.php", payload);
    if (res.success) {
      editModal?.hide();
      cargarPanelAdmin(); // Refresca tabla y gráficas con los datos modificados
    } else {
      alert(res.message || "Error al actualizar usuario.");
    }
  });
}

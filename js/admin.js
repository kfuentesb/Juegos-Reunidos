/**
 * admin.js — Panel Admin con CRUD + DataTable + Chart.js
 * Endpoints:
 *  - php/procesar.php
 *  - php/usuarios-lista.php
 *  - php/usuarios-crear.php
 *  - php/usuarios-actualizar.php
 *  - php/usuarios-eliminar.php
 */

let tablaUsuarios = null;
let chartTipos = null;
let chartPuntuacion = null;
let editModal = null;
let addModal = null;

const postForm = async (url, data) => {
  const body = new URLSearchParams(data).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  return res.json();
};

const getJson = async (url) => {
  const res = await fetch(url);
  return res.json();
};

async function verificarAdmin() {
  try {
    const data = await postForm("php/procesar.php", { accion: "estado" });
    if (!data.loggedIn || (data.user?.rol || "").toLowerCase() !== "admin") {
      alert("Acceso restringido solo a administradores");
      window.location.href = "index.html";
      return false;
    }
    return true;
  } catch {
    alert("No se pudo verificar el acceso.");
    window.location.href = "index.html";
    return false;
  }
}

async function cargarPanelAdmin() {
  try {
    const usuarios = await getJson("php/usuarios-lista.php");

    const badge = document.getElementById("total-usuarios-badge");
    if (badge) badge.textContent = usuarios.length;

    renderGraficoTipos(usuarios);
    renderGraficoPuntuaciones(usuarios);
    renderTablaUsuarios(usuarios);
  } catch (err) {
    console.error("Error al cargar panel:", err);
    alert("Error al cargar datos de usuarios.");
  }
}

function renderGraficoTipos(usuarios) {
  const conteo = {};
  usuarios.forEach(u => {
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
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

function renderGraficoPuntuaciones(usuarios) {
  const ordenados = [...usuarios].sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0));
  const nombres = ordenados.map(u => u.usuario);
  const puntos = ordenados.map(u => u.puntuacion ?? 0);

  if (chartPuntuacion) chartPuntuacion.destroy();

  const ctx = document.getElementById("grafico-puntuaciones").getContext("2d");
  chartPuntuacion = new Chart(ctx, {
    type: "bar",
    data: {
      labels: nombres,
      datasets: [{
        label: `Puntuación (${usuarios.length} usuarios)`,
        data: puntos,
        backgroundColor: "rgba(13, 110, 253, 0.7)",
        borderColor: "#0d6efd",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

function renderTablaUsuarios(usuarios) {
  const data = usuarios.map((u, i) => ({
    index: i + 1,
    idAlumno: u.idAlumno ?? "—",
    usuario: u.usuario,
    email: u.email,
    rol: u.rol,
    tipo: u.tipo,
    puntuacion: u.puntuacion ?? 0
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
      { data: "idAlumno", title: "ID Alumno", width: "80px" },
      { data: "usuario", title: "Nombre Alumno" },
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

  // EDITAR
  $("#tabla-usuarios").off("click", ".editar-usuario").on("click", ".editar-usuario", function () {
    const usuario = $(this).data("usuario");
    const fila = tablaUsuarios.rows().data().toArray().find(r => r.usuario === usuario);
    if (!fila) return;

    $("#edit-usuario-hidden").val(fila.usuario);
    $("#edit-usuario").val(fila.usuario);
    $("#edit-email").val(fila.email);
    $("#edit-tipo").val(fila.tipo);
    $("#edit-rol").val(fila.rol);
    $("#edit-puntuacion").val(fila.puntuacion);

    editModal?.show();
  });

  // ELIMINAR
  $("#tabla-usuarios").off("click", ".eliminar-usuario").on("click", ".eliminar-usuario", async function () {
    const usuario = $(this).data("usuario");
    if (!confirm(`¿Eliminar al usuario "${usuario}"?`)) return;

    const res = await postForm("php/usuarios-eliminar.php", { usuario });
    if (res.success) {
      cargarPanelAdmin();
    } else {
      alert(res.message || "Error al eliminar.");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.bootstrap?.Modal) {
    editModal = new bootstrap.Modal(document.getElementById("editUserModal"));
    addModal = new bootstrap.Modal(document.getElementById("addUserModal"));
  }

  document.getElementById("btn-add-user")?.addEventListener("click", () => {
    document.getElementById("addUserForm").reset();
    addModal?.show();
  });

  document.getElementById("addUserForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      usuario: document.getElementById("add-usuario").value.trim(),
      email: document.getElementById("add-email").value.trim(),
      tipo: document.getElementById("add-tipo").value,
      rol: document.getElementById("add-rol").value,
      password: document.getElementById("add-password").value,
      puntuacion: document.getElementById("add-puntuacion").value
    };

    const res = await postForm("php/usuarios-crear.php", payload);
    if (res.success) {
      addModal?.hide();
      cargarPanelAdmin();
    } else {
      alert(res.message || "Error al crear usuario.");
    }
  });

  $("#editUserForm").off("submit").on("submit", async function (e) {
    e.preventDefault();

    const payload = {
      usuario: $("#edit-usuario-hidden").val(),
      email: $("#edit-email").val().trim(),
      tipo: $("#edit-tipo").val(),
      rol: $("#edit-rol").val(),
      puntuacion: $("#edit-puntuacion").val()
    };

    const res = await postForm("php/usuarios-actualizar.php", payload);
    if (res.success) {
      editModal?.hide();
      cargarPanelAdmin();
    } else {
      alert(res.message || "Error al actualizar usuario.");
    }
  });

  const ok = await verificarAdmin();
  if (ok) cargarPanelAdmin();
});
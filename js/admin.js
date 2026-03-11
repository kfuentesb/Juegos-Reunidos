let tablaUsuarios = null;
let chartUsuarios = null;
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

window.addEventListener("DOMContentLoaded", () => {
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
      rol: document.getElementById("add-rol").value,
      tipo: document.getElementById("add-tipo").value,
      password: document.getElementById("add-password").value,
      puntuacion: document.getElementById("add-puntuacion").value
    };

    const res = await postForm("../php/usuarios-crear.php", payload);
    if (res.success) {
      addModal?.hide();
      cargarPanelAdmin();
    } else {
      alert(res.message || "Error al crear usuario.");
    }
  });

  postForm("/Juegos%20Reunidos/php/procesar.php", { accion: "estado" }).then((data) => {
    if (!data.loggedIn || (data.user?.rol || "").toLowerCase() !== "admin") {
      alert("Acceso restringido solo a administradores");
      window.location.href = "../index.html";
      return;
    }
    cargarPanelAdmin();
  });
});

async function cargarPanelAdmin() {
  try {
    const usuarios = await getJson("../php/usuarios-lista.php");
    renderGraficoUsuariosPorRol(usuarios);
    renderTablaUsuarios(usuarios);
  } catch {
    alert("Error al cargar usuarios.");
  }
}

function renderGraficoUsuariosPorRol(usuarios) {
  const conteo = {};
  usuarios.forEach(u => {
    const tipo = u.tipo || "jugador";
    conteo[tipo] = (conteo[tipo] || 0) + 1;
  });

  const labels = Object.keys(conteo);
  const data = Object.values(conteo);

  if (chartUsuarios) chartUsuarios.destroy();

  const ctx = document.getElementById("grafico-usuarios").getContext("2d");
  chartUsuarios = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Usuarios por tipo",
        data,
        backgroundColor: ["#0d6efd", "#20c997"]
      }]
    }
  });
}

function renderTablaUsuarios(usuarios) {
  const data = usuarios.map((u, i) => ({
    index: i + 1,
    usuario: u.usuario,
    email: u.email,
    tipo: u.tipo,
    rol: u.rol,
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
      { data: "index" },
      { data: "usuario" },
      { data: "email" },
      { data: "tipo" },
      { data: "rol" },
      { data: "puntuacion" },
      {
        data: null,
        orderable: false,
        render: function (row) {
          return `
            <button class="btn btn-sm btn-warning btn-admin editar-usuario" data-usuario="${row.usuario}">Editar</button>
            <button class="btn btn-sm btn-danger btn-admin eliminar-usuario" data-usuario="${row.usuario}">Eliminar</button>
          `;
        }
      }
    ]
  });

  $("#tabla-usuarios").off("click", ".editar-usuario").on("click", ".editar-usuario", function () {
    const usuario = $(this).data("usuario");
    const fila = tablaUsuarios.rows().data().toArray().find(r => r.usuario === usuario);
    if (!fila) return;

    $("#edit-usuario-hidden").val(fila.usuario);
    $("#edit-usuario").val(fila.usuario);
    $("#edit-email").val(fila.email);
    $("#edit-rol").val(fila.rol);
    $("#edit-tipo").val(fila.tipo);
    $("#edit-puntuacion").val(fila.puntuacion);

    editModal?.show();
  });

  $("#tabla-usuarios").off("click", ".eliminar-usuario").on("click", ".eliminar-usuario", async function () {
    const usuario = $(this).data("usuario");
    if (!confirm(`¿Seguro que deseas eliminar a ${usuario}?`)) return;

    const res = await postForm("../php/usuarios-eliminar.php", { usuario });
    if (res.success) {
      cargarPanelAdmin();
    } else {
      alert("Error al eliminar usuario.");
    }
  });

  $("#editUserForm").off("submit").on("submit", async function (e) {
    e.preventDefault();

    const payload = {
      usuario: $("#edit-usuario-hidden").val(),
      email: $("#edit-email").val().trim(),
      rol: $("#edit-rol").val(),
      tipo: $("#edit-tipo").val(),
      puntuacion: $("#edit-puntuacion").val()
    };

    const res = await postForm("../php/usuarios-actualizar.php", payload);
    if (res.success) {
      editModal?.hide();
      cargarPanelAdmin();
    } else {
      alert(res.message || "Error al actualizar usuario.");
    }
  });
}
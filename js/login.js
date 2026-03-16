/* =========================
   1) CAPTURA DE ELEMENTOS
   ========================= */
const btnDoLogin      = document.getElementById("btn-do-login");
const navJuegos       = document.getElementById("nav-juegos");
const btnLoginMain    = document.getElementById("btn-login-main");
const userProfileMenu = document.getElementById("user-profile-menu");
const loginModalEl    = document.getElementById("loginModal");
const seccionRegistro = document.getElementById("registro-seccion");

// Modal bootstrap
let loginModal = null;
try {
  if (loginModalEl && window.bootstrap?.Modal) {
    loginModal = new bootstrap.Modal(loginModalEl);
  }
} catch {}

/* =========================
   2) UTILIDADES
   ========================= */
const AUTH_EVENT_LOGIN = "auth:login";
const AUTH_EVENT_LOGOUT = "auth:logout";

function broadcastAuthChange(user) {
  const loggedIn = !!user;
  window.__auth = { loggedIn, user: user || null };
  const eventName = loggedIn ? AUTH_EVENT_LOGIN : AUTH_EVENT_LOGOUT;
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { user } }));
  } catch {}
}

const habilitarEnlaceJuegos = () => {
  if (!navJuegos) return;
  navJuegos.classList.remove("disabled");
  navJuegos.removeAttribute("aria-disabled");
  navJuegos.removeAttribute("tabindex");
};

const mostrarUIAnonimo = () => {
  if (btnLoginMain) btnLoginMain.classList.remove("d-none");
  if (userProfileMenu) userProfileMenu.classList.add("d-none");
  if (seccionRegistro) seccionRegistro.style.display = "";
};

/**
 * Enviar datos a /Juegos%20Reunidos/php/procesar.php usando AJAX POST
 * @param {string} params - Parámetros URL-encoded para enviar al servidor
 * @param {function} onOk  - Callback para exito
 * @param {function} onErr - Callback para error
 * AJA POST
 */
const postAjax = (params, onOk, onErr) => {
  const xhr = new XMLHttpRequest(); // Crear el XMLHttpRequest para hacer una petición HTTP
  xhr.onreadystatechange = function () {
    if (this.readyState === 4) { // Si Operación completada
      if (this.status === 200) { // HTTP 200 OK
        try { 
          const data = JSON.parse(this.responseText); // Objeto JS, sino es valido se captura
          onOk && onOk(data);
        } catch (err) {
          onErr && onErr("Respuesta inválida del servidor");
        }
      } else { // Si no es 200, error
        onErr && onErr("Error de conexión con el servidor");
      }
    }
  };
  xhr.open("POST", "/Juegos%20Reunidos/php/procesar.php", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); // Configuramos cabeceras en el formato nombre=Kevin&edad=20
  xhr.send(params); // accion=login&usuario=Kevin&clave=1234
};

/* =========================
   3) INICIALIZACIÓN
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  // Consultar sesión PHP
  postAjax("accion=estado", (data) => {
    if (data.loggedIn) {
      renderUserUI(data.user);
      if (seccionRegistro) seccionRegistro.style.display = "none";
      broadcastAuthChange(data.user);
    } else {
      mostrarUIAnonimo();
      broadcastAuthChange(null);
    }
  });
});

/* =========================
   4) LOGIN (AJAX POST)
   ========================= */
if (btnDoLogin) {
  btnDoLogin.addEventListener("click", () => {
    const userInp = (document.getElementById("input-user")?.value || "").trim();
    const passInp = (document.getElementById("input-pass")?.value || "").trim();

    if (!userInp || !passInp) {
      alert("Introduce usuario y contraseña.");
      return;
    }

    const params = `accion=login&usuario=${encodeURIComponent(userInp)}&password=${encodeURIComponent(passInp)}`;

    postAjax(params, (data) => {
      if (!data.success) {
        alert(data.message || "Credenciales incorrectas");
        return;
      }

      if (loginModal) loginModal.hide();
      renderUserUI(data.user);
      if (seccionRegistro) seccionRegistro.style.display = "none";
      broadcastAuthChange(data.user);
    }, (msg) => {
      alert(msg);
    });
  });
}

/* =========================
   5) PINTAR UI SEGÚN SESIÓN
   ========================= */
function renderUserUI(usuario) {
  if (!usuario) return;

  habilitarEnlaceJuegos();

  if (btnLoginMain) btnLoginMain.classList.add("d-none");
  if (userProfileMenu) userProfileMenu.classList.remove("d-none");

  const avatarImg = document.getElementById("user-avatar");
  const nameLabel = document.getElementById("user-name-label");
  const coinsLabel = document.getElementById("user-coins-label");

  if (avatarImg) avatarImg.src = usuario.avatar || "";
  if (nameLabel) nameLabel.textContent = usuario.user || "";
  if (coinsLabel) coinsLabel.textContent = `⭐ ${usuario.puntuacion ?? 0} Puntos`;

  if ((usuario.rol || "").toLowerCase() === "admin") {
    insertarPestanaAdmin();
  }

  const btnLogout =
    document.getElementById("btn-logout") ||
    document.getElementById("logout-action");

  if (btnLogout) {
    btnLogout.onclick = (e) => {
      e.preventDefault();
      postAjax("accion=logout", (data) => {
        if (data.success) {
          mostrarUIAnonimo();
          broadcastAuthChange(null);
          window.location.reload();
        }
      });
    };
  }
}

/* =========================
   6) PESTAÑA ADMIN
   ========================= */
function insertarPestanaAdmin() {
  if (document.getElementById("nav-admin")) return;

  const navList = document.querySelector(".navbar-nav");
  if (!navList) return;

  const li = document.createElement("li");
  li.className = "nav-item";
  li.innerHTML =
    '<a class="nav-link text-warning fw-bold" id="nav-admin" href="Juegos%20Reunidos/components/admin.html">Panel Admin</a>';

  navList.appendChild(li);
}
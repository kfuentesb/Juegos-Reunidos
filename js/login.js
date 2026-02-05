/* =========================================================
   LOGIN Y SESIÓN
   ---------------------------------------------------------
   Objetivo:
   - Gestionar el inicio/cierre de sesión
   - Mostrar datos del usuario logueado en la navbar
   - Habilitar los enlaces pertinentes
   - Exponer estado global y eventos para que otras páginas/scripts
     (por ejemplo juegos) conozcan el estado de login en tiempo real.
   ========================================================= */

/* =========================
   1) USUARIOS DISPONIBLES
   =========================
   - Usuarios que voy a usar:
     - admin / admin
     - user  / 1234
   - Podemos usar usuarios registrados por el formulario que se encontraran en LocalStorage
     bajo la clave "usuarios_registrados"
*/
const USUARIOS_ESTATICOS = {
  admin: {
    user: "admin",
    pass: "admin",
    nombre: "Jefe de Juegos",
    rol: "admin",
    monedas: 99999,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=admin",
  },
  user: {
    user: "user",
    pass: "1234",
    nombre: "Usuario",
    rol: "user",
    monedas: 150,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
  },
};

/* =========================
   2) CAPTURA DE ELEMENTOS
   =========================
*/
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
} catch {  }

/* =========================
   3) UTILIDADES
   ========================= */

// Lee usuarios registrados (array) desde LocalStorage
const getUsuariosRegistrados = () => {
  const raw = localStorage.getItem("usuarios_registrados");
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    // Confirmar que es un array
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// SESIÓN: guardamos el usuario logueado bajo la clave "session"
const getSession = () => {
  const raw = localStorage.getItem("session");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const setSession = (usuario) => {
  localStorage.setItem("session", JSON.stringify(usuario));
  broadcastAuthChange(usuario); 
};
const clearSession = () => {
  localStorage.removeItem("session");
  broadcastAuthChange(null); // Eliminamos la sesión
};

// Estado global y eventos para otros scripts (juegos, etc.)
const AUTH_EVENT_LOGIN = "auth:login";
const AUTH_EVENT_LOGOUT = "auth:logout";


function broadcastAuthChange(user) {
  const loggedIn = !!user;
  // Estado global accesible desde cualquier página/script
  window.__auth = { loggedIn, user: user || null };

  // Emite evento para que otros scripts reaccionen en tiempo real
  const eventName = loggedIn ? AUTH_EVENT_LOGIN : AUTH_EVENT_LOGOUT;
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { user } }));
  } catch {}
}

// Habilita el enlace "Juegos"
const habilitarEnlaceJuegos = () => {
  if (!navJuegos) return;

  // Quitar estado disabled
  navJuegos.classList.remove("disabled");
  navJuegos.removeAttribute("aria-disabled");
  navJuegos.removeAttribute("tabindex")
};

/* =========================
   4) INICIALIZACIÓN AL CARGAR
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const sesion = getSession();

  // Publica el estado global al cargar cualquier página
  broadcastAuthChange(sesion);

  // Si ya hay sesión guardada, pintamos la interfaz de usuario
  if (sesion) {
    renderUserUI(sesion);
    if (seccionRegistro) seccionRegistro.style.display = "none";
  } else {
    // Sin sesión: mostrar botón de login y ocultar menú de usuario
    if (btnLoginMain) btnLoginMain.classList.remove("d-none");
    if (userProfileMenu) userProfileMenu.classList.add("d-none");
  }

  // Sincroniza estado de sesión entre pestañas/ventanas
  window.addEventListener("storage", (ev) => {
    if (ev.key === "session") {
      const nuevaSesion = getSession();

      // Actualiza UI según el nuevo estado
      if (nuevaSesion) {
        renderUserUI(nuevaSesion);
        if (seccionRegistro) seccionRegistro.style.display = "none";
      } else {
        if (btnLoginMain) btnLoginMain.classList.remove("d-none");
        if (userProfileMenu) userProfileMenu.classList.add("d-none");
        if (seccionRegistro) seccionRegistro.style.display = "";
      }

      // Publica el nuevo estado global y evento
      broadcastAuthChange(nuevaSesion);
    }
  });
});

/* =========================
   5) LOGIN (evento click)
   ========================= */
if (btnDoLogin) {
  btnDoLogin.addEventListener("click", () => {
    const userInp = (document.getElementById("input-user")?.value || "").trim();
    const passInp = (document.getElementById("input-pass")?.value || "").trim();

    if (!userInp || !passInp) {
      alert("Introduce usuario y contraseña.");
      return;
    }

    // 1) Intentamos con usuarios estáticos (admin / user)
    let usuarioEncontrado = USUARIOS_ESTATICOS[userInp];

    // 2) Si no, buscamos en los registrados por formulario (user o email)
    if (!usuarioEncontrado) {
      const registrados = getUsuariosRegistrados();
      usuarioEncontrado = registrados.find(
        (u) => u.user === userInp || u.email === userInp
      );
    }

    // 3) Validamos contraseña
    const credencialesOK =
      usuarioEncontrado && (usuarioEncontrado.pass || "") === passInp;

    if (!credencialesOK) {
      alert("Usuario o contraseña incorrectos. Prueba con admin/admin o user/1234");
      return;
    }

    // 4) Guardamos sesión y actualizamos la UI
    setSession(usuarioEncontrado); // <-- ahora también publica estado y evento
    if (loginModal) loginModal.hide();
    renderUserUI(usuarioEncontrado);
    if (seccionRegistro) seccionRegistro.style.display = "none";
  });
}

/* =========================
   6) PINTAR UI SEGÚN SESIÓN
   =========================
   - Habilita link "Juegos"
   - Cambia botón "Iniciar Sesión" por menú de usuario
   - Rellena avatar, nombre y monedas
   - Añade pestaña Admin si el rol lo requiere
   - "Cerrar Sesión"
*/
function renderUserUI(usuario) {
  if (!usuario) return;

  // a) Habilitar pestaña "Juegos"
  habilitarEnlaceJuegos();

  // b) Cambiamos ver perfil por login
  if (btnLoginMain) btnLoginMain.classList.add("d-none");
  if (userProfileMenu) userProfileMenu.classList.remove("d-none");

  // c) Datos del perfil en la navbar
  const avatarImg = document.getElementById("user-avatar");
  const nameLabel = document.getElementById("user-name-label");
  const coinsLabel = document.getElementById("user-coins-label");

  if (avatarImg) avatarImg.src = usuario.avatar || "";
  if (nameLabel) nameLabel.textContent = usuario.nombre || usuario.user || "";
  if (coinsLabel) coinsLabel.textContent = `💰 ${usuario.monedas ?? 0} Monedas`;

  // D) Insertamos la pestaña admin
  if ((usuario.rol || "").toLowerCase() === "admin") {
    insertarPestanaAdmin();
  }

  // E) Boton cerrar sesión
  const btnLogout =
    document.getElementById("btn-logout") ||
    document.getElementById("logout-action");
  if (btnLogout) {
    btnLogout.onclick = (e) => {
      e.preventDefault();
      clearSession();         // <-- publica estado y evento
      window.location.reload(); // Mantiene tu comportamiento actual
    };
  }
}

/* =========================
   7) PESTAÑA ADMIN
   =========================
*/
function insertarPestanaAdmin() {
  if (document.getElementById("nav-admin")) return;

  const navList = document.querySelector(".navbar-nav");
  if (!navList) return;

  const li = document.createElement("li");
  li.className = "nav-item";
  li.innerHTML =
    '<a class="nav-link text-warning fw-bold" id="nav-admin" href="#">Panel Admin</a>';

  navList.appendChild(li);
}
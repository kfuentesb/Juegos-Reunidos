/* =========================
   1) CAPTURA DE ELEMENTOS
   ========================= */
const form = document.getElementById('registroForm');
const usuario = document.getElementById('usuario');
const email = document.getElementById('email');
const telefono = document.getElementById('telefono');
const fecha = document.getElementById('fecha');
const rol = document.getElementById('rol');
const pass1 = document.getElementById('password');
const pass2 = document.getElementById('password2');
const checkboxesIntereses = document.querySelectorAll('input[type="checkbox"]');

/* =========================
   2) CONFIGURACIÓN INICIAL
   ========================= */
const hoyStr = new Date().toISOString().split('T')[0];
fecha.setAttribute('max', hoyStr);

/* =========================
   3) UTILIDADES
   ========================= */
const pintarEstado = (el, ok) => {
  if (!el) return;
  el.classList.toggle('is-valid', !!ok);
  el.classList.toggle('is-invalid', !ok);
};

/* =========================
   4) VALIDADORES
   ========================= */
const RE_EMAIL_RESTRINGIDO = /^[^\s@]+@([A-Za-z0-9-]+)\.(es|com)$/i;

const validarUsuarioDet = () => {
  const valor = usuario.value.trim();
  const mensajes = [];

  if (!valor) {
    mensajes.push('Campo obligatorio');
  } else {
    if (valor.length < 3) mensajes.push('Mínimo 3 caracteres');
    if (!/^[a-zA-Z0-9]+$/.test(valor)) mensajes.push('Solo letras y números, sin símbolos');
  }

  const ok = mensajes.length === 0;
  pintarEstado(usuario, ok);
  return { ok, mensajes };
};

const validarEmailDet = () => {
  const valor = email.value.trim().toLowerCase();
  const mensajes = [];

  if (!valor) {
    mensajes.push('Campo obligatorio');
  } else {
    const match = RE_EMAIL_RESTRINGIDO.exec(valor);
    const dominio = match?.[1] || '';
    if (!match) mensajes.push('Formato: texto@dominio.es o texto@dominio.com');
    else if (!dominio) mensajes.push('El dominio no puede estar vacío');
  }

  const ok = mensajes.length === 0;
  pintarEstado(email, ok);
  return { ok, mensajes };
};

const validarTelefonoDet = () => {
  const valor = telefono.value.trim();
  const mensajes = [];

  if (!valor) {
    mensajes.push('Campo obligatorio');
  } else if (!/^[0-9]{9}$/.test(valor)) {
    mensajes.push('Debe tener exactamente 9 números');
  }

  const ok = mensajes.length === 0;
  pintarEstado(telefono, ok);
  return { ok, mensajes };
};

const validarFechaDet = () => {
  const val = fecha.value;
  const mensajes = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (!val) {
    mensajes.push('Campo obligatorio');
  } else {
    const fechaSel = new Date(val);
    if (!(fechaSel instanceof Date) || Number.isNaN(fechaSel.getTime())) {
      mensajes.push('Fecha inválida');
    } else if (fechaSel >= hoy) {
      mensajes.push('Debe ser anterior a hoy');
    }
  }

  const ok = mensajes.length === 0;
  pintarEstado(fecha, ok);
  return { ok, mensajes };
};

const validarRolDet = () => {
  const mensajes = [];
  if (!rol.value.trim()) mensajes.push('Selecciona una opción');
  const ok = mensajes.length === 0;
  pintarEstado(rol, ok);
  return { ok, mensajes };
};

const validarInteresesDet = () => {
  const seleccionados = Array.from(checkboxesIntereses).filter((c) => c.checked).length;
  const ok = seleccionados >= 2;
  checkboxesIntereses.forEach((c) => pintarEstado(c, ok));
  const mensajes = ok ? [] : ['Selecciona al menos 2 intereses'];
  return { ok, mensajes };
};

const actualizarReglasPassword = (reglas) => {
  const pintar = (id, cond) => {
    const el = document.getElementById(id);
    if (el) el.style.color = cond ? 'green' : 'red';
  };
  pintar('rule-length', reglas.largo);
  pintar('rule-uppercase', reglas.mayus);
  pintar('rule-number', reglas.num);
  pintar('rule-special', reglas.especial);
  pintar('rule-match', reglas.coincide);
};

const validarPassDet = () => {
  const v1 = pass1.value || '';
  const v2 = pass2.value || '';
  const mensajes = [];

  const reglas = {
    largo: v1.length >= 8,
    mayus: /[A-Z]/.test(v1),
    num: /\d/.test(v1),
    especial: /[!@#$%^&*]/.test(v1),
    coincide: v1 !== '' && v1 === v2,
  };

  actualizarReglasPassword(reglas);

  const faltantes = [];
  if (!reglas.largo) faltantes.push('mínimo 8 caracteres');
  if (!reglas.mayus) faltantes.push('al menos una mayúscula');
  if (!reglas.num) faltantes.push('al menos un número');
  if (!reglas.especial) faltantes.push('al menos un símbolo (!@#$%^&*)');

  if (faltantes.length > 0) mensajes.push('No cumple requisitos: ' + faltantes.join(', '));
  if (!reglas.coincide) mensajes.push('Las contraseñas deben coincidir');

  const passOk = reglas.largo && reglas.mayus && reglas.num && reglas.especial;
  const ok = passOk && reglas.coincide;

  pintarEstado(pass1, passOk);
  pintarEstado(pass2, reglas.coincide);

  return { ok, mensajes, reglas };
};

/* =========================
   5) EVENTOS EN TIEMPO REAL
   ========================= */
usuario.addEventListener('input', () => validarUsuarioDet());
email.addEventListener('input', () => validarEmailDet());
telefono.addEventListener('input', () => validarTelefonoDet());
fecha.addEventListener('change', () => validarFechaDet());
rol.addEventListener('change', () => validarRolDet());
checkboxesIntereses.forEach((c) => c.addEventListener('change', () => validarInteresesDet()));
pass1.addEventListener('input', () => validarPassDet());
pass2.addEventListener('input', () => validarPassDet());

/* =========================
   6) ENVÍO FORMULARIO (AJAX + JQUERY)
   ========================= */
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const resUsuario = validarUsuarioDet();
  const resEmail = validarEmailDet();
  const resTelefono = validarTelefonoDet();
  const resFecha = validarFechaDet();
  const resRol = validarRolDet();
  const resIntereses = validarInteresesDet();
  const resPass = validarPassDet();

  const errores = [];
  if (!resUsuario.ok) errores.push('Usuario: ' + resUsuario.mensajes.join('; '));
  if (!resEmail.ok) errores.push('Correo electrónico: ' + resEmail.mensajes.join('; '));
  if (!resTelefono.ok) errores.push('Teléfono: ' + resTelefono.mensajes.join('; '));
  if (!resFecha.ok) errores.push('Fecha de nacimiento: ' + resFecha.mensajes.join('; '));
  if (!resRol.ok) errores.push('Frecuencia de juego: ' + resRol.mensajes.join('; '));
  if (!resIntereses.ok) errores.push('Intereses: ' + resIntereses.mensajes.join('; '));
  if (!resPass.ok) errores.push('Contraseñas: ' + resPass.mensajes.join('; '));

  if (errores.length > 0) {
    alert('⚠️ ATENCIÓN: Se han encontrado errores:\n\n- ' + errores.join('\n- '));
    const primeroInvalido =
      form.querySelector('.is-invalid') ||
      form.querySelector('input.is-invalid, select.is-invalid');
    if (primeroInvalido) primeroInvalido.focus();
    return;
  }

  const datos = {
    usuario: usuario.value.trim(),
    email: email.value.trim(),
    telefono: telefono.value.trim(),
    fecha: fecha.value,
    genero: document.querySelector('input[name="genero"]:checked')?.value || 'no-decirlo',
    rol: rol.value,
    juego_estrategia: document.getElementById('juego_estrategia')?.checked ? 1 : 0,
    juego_accion: document.getElementById('juego_accion')?.checked ? 1 : 0,
    juego_rpg: document.getElementById('juego_rpg')?.checked ? 1 : 0,
    juego_puzzle: document.getElementById('juego_puzzle')?.checked ? 1 : 0,
    juego_carreras: document.getElementById('juego_carreras')?.checked ? 1 : 0,
    password: pass1.value
  };

  // AJAX con jQuery para enviar datos al servidor
  $.ajax({ // Generamos la petición asyncrona
    url: '../php/registro.php',
    method: 'POST',
    data: datos,
    dataType: 'json',
    success: function (respuesta) { // Función que se ejecuta cuando el servidor responde con éxito
      if (!respuesta.success) {
        alert(respuesta.message || 'Error al registrar');
        return;
      }
      alert('¡Registro completado con éxito! Bienvenido a Juegos Reunidos.');
      window.location.href = '../index.html';
    },
    error: function () {
      alert('Error de conexión con el servidor');
    }
  });
});
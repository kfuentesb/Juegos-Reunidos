/* =========================
   1) CAPTURA DE ELEMENTOS
   ========================= */
const form = document.getElementById('contactForm');
const nombre = document.getElementById('nombre');
const email = document.getElementById('email');
// const asunto = document.getElementById('asunto');
const mensaje = document.getElementById('mensaje');

/* =========================
   2) VALIDADORES
   ========================= */
// Email genérico: texto@texto.dominio
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida nombre (requerido y mínimo 3 caracteres)
const validarNombreDet = () => {
  const valor = (nombre.value || '').trim();
  const mensajes = [];
  if (!valor) mensajes.push('Campo obligatorio');
  if (valor && valor.length < 3) mensajes.push('Mínimo 3 caracteres');
  const ok = mensajes.length === 0;
  pintarEstado(nombre, ok);
  return { ok, mensajes };
};

// Valida email (requerido)
const validarEmailDet = () => {
  const valor = (email.value || '').trim();
  const mensajes = [];
  if (!valor) mensajes.push('Campo obligatorio');
  else if (!RE_EMAIL.test(valor)) mensajes.push('Formato de email inválido (ej: ejemplo@correo.com)');
  const ok = mensajes.length === 0;
  return { ok, mensajes };
};

// Valida mensaje (requerido + mínimo 10 caracteres)
const validarMensajeDet = () => {
  const valor = (mensaje.value || '').trim();
  const mensajes = [];
  if (!valor) mensajes.push('Campo obligatorio');
  if (valor && valor.length < 10) mensajes.push('Mínimo 10 caracteres para describir tu consulta');
  const ok = mensajes.length === 0;
  return { ok, mensajes };
};

/* =========================
   3) ENVÍO DEL FORMULARIO
   =========================
*/
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Ejecutar validaciones
  const resNombre = validarNombreDet();
  const resEmail = validarEmailDet();
  const resMensaje = validarMensajeDet();

  // Construir listado de errores con explicación por campo
  const errores = [];
  if (!resNombre.ok) errores.push('Nombre: ' + resNombre.mensajes.join('; '));
  if (!resEmail.ok) errores.push('Correo electrónico: ' + resEmail.mensajes.join('; ')); 
  if (!resMensaje.ok) errores.push('Mensaje: ' + resMensaje.mensajes.join('; '));

  // Si hay errores, alert con resumen
  if (errores.length > 0) {
    alert('⚠️ ATENCIÓN: Revisa los siguientes puntos:\n\n- ' + errores.join('\n- '));
    const primeroInvalido =
      form.querySelector('.is-invalid') ||
      form.querySelector('input.is-invalid, select.is-invalid, textarea.is-invalid');
    if (primeroInvalido) primeroInvalido.focus();
    return;
  }

  // Simulación de envío correcto
  alert('✅ Mensaje enviado correctamente. ¡Gracias por contactarnos!');
  form.reset();

});

/* =========================*/
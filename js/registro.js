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
// Bloquear fechas futuras
const hoyStr = new Date().toISOString().split('T')[0]; // AAAA-MM-DD
fecha.setAttribute('max', hoyStr);

/* =========================
   3) UTILIDADES
   ========================= */
// Leer usuarios guardados (JSON). Devuelve [] si no hay o está corrupto.
const obtenerUsuarios = () => {
  const raw = localStorage.getItem('usuarios_registrados');
  if (!raw) return [];
  try {
    const datos = JSON.parse(raw);
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
};

// Guardar lista de usuarios (JSON)
const guardarUsuarios = (lista) => {
  localStorage.setItem('usuarios_registrados', JSON.stringify(lista));
};

// Pinta clases CSS en función de si es válido (verde) o inválido (rojo)
const pintarEstado = (el, ok) => {
  if (!el) return;
  el.classList.toggle('is-valid', !!ok);
  el.classList.toggle('is-invalid', !ok);
};

/* =========================
   4) REGLAS Y VALIDADORES CON MENSAJES
   ========================= */
// Email permitido: texto@dominio.es o texto@dominio.com
const RE_EMAIL_RESTRINGIDO = /^[^\s@]+@([A-Za-z0-9-]+)\.(es|com)$/i;

// Valida usuario y devuelve errores
const validarUsuarioDet = () => {
  const valor = usuario.value.trim();
  const mensajes = [];

  if (!valor) {
    mensajes.push('Campo obligatorio');
  } else {
    if (valor.length < 3) mensajes.push('Mínimo 3 caracteres');
    if (!/^[a-zA-Z0-9]+$/.test(valor)) mensajes.push('Solo letras y números, sin símbolos');
    // if (valor.toLowerCase() === 'admin') mensajes.push('El nombre "admin" no está permitido');
    const dup = obtenerUsuarios().some((u) => (u.user || '').toLowerCase() === valor.toLowerCase());
    // usuario ya existente
    if (dup) mensajes.push('Este usuario ya existe');
  }

  const ok = mensajes.length === 0;
  pintarEstado(usuario, ok);
  return { ok, mensajes };
};

// Valida email
const validarEmailDet = () => {
  const valor = email.value.trim().toLowerCase();
  const mensajes = [];

  if (!valor) {
    mensajes.push('Campo obligatorio');
  } else {
    const match = RE_EMAIL_RESTRINGIDO.exec(valor);
    // Capturamos el valor del dominio de texto@dominio.es
    const dominio = match?.[1] || '';
    if (!match) mensajes.push('Formato: texto@dominio.es o texto@dominio.com');
    else if (!dominio) mensajes.push('El dominio no puede estar vacío');
    const dup = obtenerUsuarios().some((u) => (u.email || '').toLowerCase() === valor);
    if (dup) mensajes.push('Este email ya está registrado');
  }

  const ok = mensajes.length === 0;
  pintarEstado(email, ok);
  return { ok, mensajes };
};

// Valida teléfono
const validarTelefonoDet = () => {
  const valor = telefono.value.trim();
  const mensajes = [];

  if (!valor) {
    mensajes.push('Campo obligatorio');
    // Solo números, sin espacios ni símbolos y confirmamos que se cumple .test(valor)
  } else if (!/^[0-9]{9}$/.test(valor)) {
    mensajes.push('Debe tener exactamente 9 números');
  }

  const ok = mensajes.length === 0;
  pintarEstado(telefono, ok);
  return { ok, mensajes };
};

// Valida fecha y devuelve
const validarFechaDet = () => {
  const val = fecha.value;
  const mensajes = [];
  const hoy = new Date();
  // Ajustamos la fecha actual a medianoche para comparar solo fechas
  hoy.setHours(0, 0, 0, 0);

  if (!val) {
    mensajes.push('Campo obligatorio');
  } else {
    const fechaSel = new Date(val);
    if (!(fechaSel instanceof Date) || Number.isNaN(fechaSel.getTime())) {
      mensajes.push('Fecha inválida');
    } 
    else if (fechaSel >= hoy) {
      mensajes.push('Debe ser anterior a hoy');
    }
  }

  const ok = mensajes.length === 0;
  pintarEstado(fecha, ok);
  return { ok, mensajes };
};

// Valida rol y devuelve { ok, mensajes[] }
const validarRolDet = () => {
  const mensajes = [];
  if (!rol.value.trim()) mensajes.push('Selecciona una opción');
  const ok = mensajes.length === 0;
  pintarEstado(rol, ok);
  return { ok, mensajes };
};

// Intereses: mínimo 2 seleccionados. Devuelve { ok, mensajes[] }
const validarInteresesDet = () => {
  const seleccionados = Array.from(checkboxesIntereses).filter((c) => c.checked).length;
  const ok = seleccionados >= 2;
  // Pintar todos los checkboxes
  checkboxesIntereses.forEach((c) => pintarEstado(c, ok));
  const mensajes = ok ? [] : ['Selecciona al menos 2 intereses'];
  return { ok, mensajes };
};

// Actualiza los colores de las reglas
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

// Valida password y devuelve { ok, mensajes[], reglas }
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

  // Actualizar indicadores visuales si existen
  actualizarReglasPassword(reglas);

  // Construir explicación
  const faltantes = [];
  if (!reglas.largo) faltantes.push('mínimo 8 caracteres');
  if (!reglas.mayus) faltantes.push('al menos una mayúscula');
  if (!reglas.num) faltantes.push('al menos un número');
  if (!reglas.especial) faltantes.push('al menos un símbolo (!@#$%^&*)');

  if (faltantes.length > 0) mensajes.push('No cumple requisitos: ' + faltantes.join(', '));
  if (!reglas.coincide) mensajes.push('Las contraseñas deben coincidir');

  const passOk = reglas.largo && reglas.mayus && reglas.num && reglas.especial;
  const ok = passOk && reglas.coincide;

  // Pintar estado de cada input de contraseña
  pintarEstado(pass1, passOk);
  pintarEstado(pass2, reglas.coincide);

  return { ok, mensajes, reglas };
};

/* =========================
   5) EVENTOS EN TIEMPO REAL
   =========================
   Validamos y pintamos estado TICK o X
*/
usuario.addEventListener('input', () => validarUsuarioDet());
email.addEventListener('input', () => validarEmailDet());
telefono.addEventListener('input', () => validarTelefonoDet());
fecha.addEventListener('change', () => validarFechaDet());
rol.addEventListener('change', () => validarRolDet());
checkboxesIntereses.forEach((c) => c.addEventListener('change', () => validarInteresesDet()));
pass1.addEventListener('input', () => validarPassDet());
pass2.addEventListener('input', () => validarPassDet());

/* =========================
   6) ENVÍO DEL FORMULARIO
   =========================
   Se mostrará un alert con el resumen de los errores si hay
*/
form.addEventListener('submit', (e) => {
    // Aquí evitamos el envio del formulario para que el usuario no tenga que volver a escribir al equivocarse, sino que mantenga el contenido
  e.preventDefault();

  // Ejecutar todas las validaciones detalladas
  const resUsuario = validarUsuarioDet();
  const resEmail = validarEmailDet();
  const resTelefono = validarTelefonoDet();
  const resFecha = validarFechaDet();
  const resRol = validarRolDet();
  const resIntereses = validarInteresesDet();
  const resPass = validarPassDet();

  // Construir listado de errores con explicación por campo
  const errores = [];

  if (!resUsuario.ok) errores.push('Usuario: ' + resUsuario.mensajes.join('; '));
  if (!resEmail.ok) errores.push('Correo electrónico: ' + resEmail.mensajes.join('; '));
  if (!resTelefono.ok) errores.push('Teléfono: ' + resTelefono.mensajes.join('; '));
  if (!resFecha.ok) errores.push('Fecha de nacimiento: ' + resFecha.mensajes.join('; '));
  if (!resRol.ok) errores.push('Frecuencia de juego: ' + resRol.mensajes.join('; '));
  if (!resIntereses.ok) errores.push('Intereses: ' + resIntereses.mensajes.join('; '));
  if (!resPass.ok) errores.push('Contraseñas: ' + resPass.mensajes.join('; '));

  // Si hay errores, mostrar alerta con los detalles
  if (errores.length > 0) {
    alert('⚠️ ATENCIÓN: Se han encontrado errores:\n\n- ' + errores.join('\n- '));
    const primeroInvalido =
      form.querySelector('.is-invalid') ||
      form.querySelector('input.is-invalid, select.is-invalid');
    if (primeroInvalido) primeroInvalido.focus();
    return;
  }

  // Si todo OK, registrar y guardar
  const lista = obtenerUsuarios();
  const nombre = usuario.value.trim();
  const correo = email.value.trim();

  lista.push({
    user: nombre,
    email: correo,
    pass: pass1.value,
    genero: document.querySelector('input[name="genero"]:checked')?.value || 'no-decirlo',
    monedas: 500,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nombre)}`,
  });

  guardarUsuarios(lista);

  alert('¡Registro completado con éxito! Bienvenido a Juegos Reunidos.');
  window.location.href = '../index.html';
});
 
// ========================
// FUNCTION ENVIAR R7
// ========================
function enviar() {
    //Recoger datos del formulario:
    //valor=document.datos.minumero.value; //número escrito por el usuario
    var valor= document.getElementById("minumero").value;
    //Escribir la url para enviar los datos anteriores:
    ruta="..procesar.php" //ruta del archivo
    envio1="numero="+valor; //datos puntuacion
    url=ruta+"?"+envio1; //url para enviar
    //url=ruta+"?"+envio1+"&"+envio2; 
    //ajax1=new ObjetoAjax; //instanciar objeto ObjetoAjax;
    //ajax1.pedirTexto(url,"comp"); //método que devuelve texto en un id.
    
            var xhr = new XMLHttpRequest();
            var txt = "";
            xhr.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var array = JSON.parse(this.responseText);
                    alert("Longitud del array "+array.length);
                    for (x in array) {
                       
                       txt += array[x].alumno + " : " + array[x].puntuacion + "<br/>";
                    }
                    
                    document.getElementById("txtHint").innerHTML = txt;
                }
            }

    xhr.open("GET",url, true);
    xhr.send();

    }
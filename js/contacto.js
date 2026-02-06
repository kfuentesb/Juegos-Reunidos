const form = document.getElementById('contactForm');

form.addEventListener('submit', (e) => {
  if (!form.checkValidity()) {
    // Evita envío si hay errores y deja que el navegador muestre los mensajes
    e.preventDefault();
    return;
  }

  // Simulación de envío correcto
  e.preventDefault();
  alert('✅ Mensaje enviado correctamente. ¡Gracias por contactarnos!');
  form.reset();
});
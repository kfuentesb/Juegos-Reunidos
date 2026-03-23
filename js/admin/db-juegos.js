// =======================
// VARIABLES GLOBALES - JUEGOS
// =======================
let datosJuegos = null;
let tablaJuegosInstancia = null;

// ============================================================
// FUNCIONES PARA LA GESTIÓN DE JUEGOS
// ============================================================
function cargarDatosJuegos() {
  return fetch('../components/juegos.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudo cargar juegos.json: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      datosJuegos = data;
      console.log('Juegos cargados correctamente');
      return data;
    })
    .catch(error => {
      console.error('Error cargando juegos:', error);
      return fetch('juegos.json')
        .then(r => r.json())
        .then(data => {
          datosJuegos = data;
          return data;
        })
        .catch(e => {
          console.error('También falló ruta alternativa:', e);
        });
    });
}
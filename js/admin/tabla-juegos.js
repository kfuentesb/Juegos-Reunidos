/**
 * Muestra la tabla de juegos de acuerdo al tipo seleccionado en el filtro.
 */
function mostrarTablaJuegos() {
  const tipoSeleccionado = document.getElementById('filtro-tipo-juego').value;
  const tabla = document.getElementById('tabla-juegos');
  const mensaje = document.getElementById('mensaje-seleccion-juegos');

  if (!tipoSeleccionado) {
    tabla.style.display = 'none';
    mensaje.style.display = 'block';
    if (tablaJuegosInstancia) {
      tablaJuegosInstancia.destroy();
      tablaJuegosInstancia = null;
    }
    return;
  }

  if (!datosJuegos || !datosJuegos.tiposDeJuego) {
    console.error('No hay datos de juegos cargados');
    alert('Error: No se pudieron cargar los datos de juegos');
    return;
  }

  mensaje.style.display = 'none';
  tabla.style.display = 'table';

  const juegos = datosJuegos.tiposDeJuego[tipoSeleccionado];
  if (!juegos) {
    console.error('Tipo de juego no encontrado:', tipoSeleccionado);
    return;
  }

  const datosTabla = [];
  juegos.forEach(juego => {
    juego.jugadores.forEach((jugador, index) => {
      datosTabla.push({
        juego: index === 0 ? juego.nombre : '',
        jugador: jugador.nombre,
        edadJugador: jugador.edad,
        puntuacion: jugador.puntuacion,
        edadRecomendada: index === 0 ? juego.edadRecomendada + '+' : '',
        categoria: index === 0 ? juego.categoria : '',
        esPrimeraFila: index === 0,
        totalFilas: juego.jugadores.length
      });
    });
  });

  if (tablaJuegosInstancia) {
    tablaJuegosInstancia.destroy();
  }

  tablaJuegosInstancia = $('#tabla-juegos').DataTable({
    data: datosTabla,
    responsive: true,
    language: { 
      url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json",
      emptyTable: "No hay datos disponibles"
    },
    columns: [
      { 
        data: 'juego',
        title: 'Juego',
        render: function(data, type, row) {
          if (row.esPrimeraFila && data) {
            return `<strong style="background: #e9ecef; padding: 5px 10px; border-radius: 5px; display: inline-block;">${data}</strong>`;
          }
          return data;
        }
      },
      { data: 'jugador', title: 'Jugador' },
      { data: 'edadJugador', title: 'Edad Jugador', render: data => data + ' años' },
      { 
        data: 'puntuacion', 
        title: 'Puntuación',
        render: data => `<span class="fw-bold text-primary">${data} pts</span>`
      },
      { 
        data: 'edadRecomendada', 
        title: 'Edad Recomendada',
        render: function(data, type, row) {
          if (row.esPrimeraFila && data) {
            return `<span class="badge bg-secondary">${data}</span>`;
          }
          return data;
        }
      },
      { 
        data: 'categoria', 
        title: 'Categoría',
        render: function(data, type, row) {
          if (row.esPrimeraFila && data) {
            const badgeClass = data === 'estrategia' ? 'badge-estrategia' : 'badge-familiar';
            return `<span class="badge ${badgeClass} badge-categoria">${data}</span>`;
          }
          return data;
        }
      }
    ],
    order: [],
    createdRow: function(row, data, dataIndex) {
      if (!data.esPrimeraFila) {
        $(row).addClass('jugador-row');
      }
    }
  });
}
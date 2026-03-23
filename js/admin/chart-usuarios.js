// ===========================================
// GRAFICO DONUT DE TIPOS DE USUARIO (Chart.js)
// ===========================================
function renderGraficoTipos(lista) {
  const conteo = {};
  lista.forEach(u => {
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
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// ==================================================
// GRAFICO BARRAS DE PUNTUACION DE USUARIOS (Chart.js)
// ==================================================
function renderGraficoPuntuaciones(lista) {
  const ordenados = [...lista].sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0));
  const nombres = ordenados.map(u => u.usuario);
  const puntos = ordenados.map(u => u.puntuacion ?? 0);

  if (chartPuntuacion) chartPuntuacion.destroy();

  const ctx = document.getElementById("grafico-puntuaciones").getContext("2d");
  chartPuntuacion = new Chart(ctx, {
    type: "bar",
    data: {
      labels: nombres,
      datasets: [{
        label: `Puntuación (${lista.length} usuarios)`,
        data: puntos,
        backgroundColor: "rgba(13, 110, 253, 0.7)",
        borderColor: "#0d6efd",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
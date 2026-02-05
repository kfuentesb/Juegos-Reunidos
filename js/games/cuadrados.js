window.addEventListener("DOMContentLoaded", () => {
  // =========================
  // 1. REFERENCIAS AL DOM
  // =========================
  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;
  // Donde vamos a draw()
  const ctx = canvas.getContext("2d");
  const scoreLabel = document.getElementById("score-label");
  const timeLabel = document.getElementById("time-label");
  const pauseOverlay = document.getElementById("pause-overlay");
  const eventLog = document.getElementById("event-log");
  const mousePositionLabel = document.getElementById("mouse-log");

  // =========================
  // 2. ESTADO DEL JUEGO
  // =========================
  let canvasWidth, canvasHeight;
  let box;
  let enemy;
  let score = 0;
  let running = false;
  let tiempoRestante = 30;
  let timerId = null;
  let clickTimeout = null;

  // Registro de logs
  const logs = [];
  const LOG_LIMIT = 8;

  // Teclas disponibles
  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false
  };

  // =========================
  // 3. FUNCIONES AUXILIARES
  // =========================
  const isLoggedIn = () => !! window.__auth?.loggedIn;

  function pushLog(text) {
    const timestamp = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }); 
    logs.push(`[${timestamp}] ${text}`);
    if (logs.length > LOG_LIMIT) logs.shift();
    if (eventLog) eventLog.innerHTML = logs.join("<br>");
  }

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 420;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    if (!box) reset_box();
    place_enemy();
    draw();
  }

  // =========================
  // 4. EVENTOS
  // =========================
  window.addEventListener("resive", resizeCanvas);
  resizeCanvas();

  // Bloquear click derecho
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // Movimiento del ratón (posición en tiempo real)
  canvas.addEventListener("mousemove", (e) => {
    if (!mousePositionLabel) return;
    // Posición real del canvas
    const rect = canvas.getBoundingClientRect();
    // Calculamos la posición del ratón
    const mouseX = Math.floor(e.clientX - rect.left);
    const mouseY = Math.floor(e.clientY - rect.top);
    // Aqui podemos mostrar la posición de coordenada X e Y
    mousePositionLabel.textContent = `Mouse: (${mouseX}, ${mouseY})`;
  });

  // Click simple
  canvas.addEventListener("click", () => {
    if (!running) return;
    clickTimeout = setTimeout(() => {
      const extra = Math.floor(Math.random() * 10) + 1;
      score += extra;
      if (scoreLabel) scoreLabel.textContent = score;
      pushLog(`Click: +${extra} | Total=${score}`);
    }, 200);
  });

  // Doble click
  canvas.addEventListener("dblclick", () => {
    if (!running) return;
    clearTimeout(clickTimeout);
    score += 20;
    if (scoreLabel) scoreLabel.textContent = score;
    pushLog(`Doble click: +20 | Total=${score}`);
  });

  // Teclas
  window.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    if (keys.hasOwnProperty(key)) {
      keys[key] = true;
      pushLog(`Tecla: ${key.toUpperCase()} | Total=${score}`);
      e.preventDefault();
    }

    if (e.key === "Enter") startGame();
    if (e.key === " ") togglePause();
    if (e.key.toLowerCase() === "r") reset();
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keys.hasOwnProperty(key)) {
      keys[key] = false;
      e.preventDefault();
    }
  });

  // =========================
  // 5. BUCLE PRINCIPAL
  // =========================
  function update() {
    if (!box) return;
    if (!enemy) place_enemy();

    if (running) {
      if (keys.ArrowUp || keys.w) box.y -= box.speed;
      if (keys.ArrowDown || keys.s) box.y += box.speed;
      if (keys.ArrowLeft || keys.a) box.x -= box.speed;
      if (keys.ArrowRight || keys.d) box.x += box.speed;

      // Limitar dentro del canvas
      if (box.x < 0) box.x = 0;
      if (box.y < 0) box.y = 0;
      if (box.x + box.width > canvasWidth) box.x = canvasWidth - box.width;
      if (box.y + box.height > canvasHeight) box.y = canvasHeight - box.height;

      // Colisión
      if (isColliding(box, enemy)) {
        increase_score();
        place_enemy();
        pushLog(`Colisión: +100 | Total=${score}`);
      }
    }

    draw();
    requestAnimationFrame(update);
  }

  // =========================
  // 6. DIBUJADO
  // =========================
  function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = "#0b0f19";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(box.x, box.y, box.width, box.height);
  }

  // =========================
  // 7. FUNCIONES DE JUEGO
  // =========================
  function place_enemy() {
    enemy = {
      x: Math.floor(Math.random() * (canvasWidth - 50)),
      y: Math.floor(Math.random() * (canvasHeight - 50)),
      width: 50,
      height: 50
    };
  }

  function reset_box() {
    box = {
      x: canvasWidth / 2 - 25,
      y: canvasHeight / 2 - 25,
      width: 50,
      height: 50,
      speed: 5
    };
  }

  function isColliding(box, enemy) {
    return (
      box.x < enemy.x + enemy.width &&
      box.x + box.width > enemy.x &&
      box.y < enemy.y + enemy.height &&
      box.y + box.height > enemy.y
    );
  }

  function increase_score() {
    score += 100;
    if (scoreLabel) scoreLabel.textContent = score;
  }

  function reset() {
    score = 0;
    tiempoRestante = 30;
    if (scoreLabel) scoreLabel.textContent = score;
    if (timeLabel) timeLabel.textContent = "00:30";
    reset_box();
    for (let k in keys) keys[k] = false;
    stopTimer();
    running = false;
    if (pauseOverlay) pauseOverlay.classList.remove("active");
    pushLog("Reinicio de partida.");
  }

  function startGame() {
    if (!isLoggedIn()) {
      alert("Debes iniciar sesión para jugar.");
      return;
    }
    if (!running) {
      running = true;
      if (pauseOverlay) pauseOverlay.classList.remove("active");
      startTimer();
      pushLog("Juego iniciado.");
    }
  }

  function togglePause() {
    if (!isLoggedIn()) return;
    running = !running;
    if (pauseOverlay) pauseOverlay.classList.toggle("active", !running);
    pushLog(running ? "Juego reanudado." : "Juego en pausa.");
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      tiempoRestante -= 1;
      if (timeLabel) {
        timeLabel.textContent = `00:${tiempoRestante < 10 ? "0" + tiempoRestante : tiempoRestante}`;
      }
      if (tiempoRestante <= 0) {
        stopTimer();
        running = false;
        alert(`Tu puntuación es: ${score}`);
        reset();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  // =========================
  // 8. INICIO
  // =========================
  update();
});
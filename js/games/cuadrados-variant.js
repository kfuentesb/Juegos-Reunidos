(() => {
  // ============================================================
  // SECCIÓN 1: CONFIGURACIÓN GENERAL DEL JUEGO
  // ============================================================
  // Tiempo total de juego, tamaño del jugador, velocidad, etc.
  const GAME_MS = 60_000;          // Duración de la partida (60s)
  const TICK_MS = 1000;            // Intervalo de actualización del tiempo
  const PLAYER_SIZE = 40;          // Tamaño del cuadrado jugador
  const SPEED = 260;               // Velocidad en px/seg
  const MATCH_THRESHOLD = 8;       // Tolerancia para "coincidencia"
  const CLICK_DELAY = 250;         // Delay para diferenciar click/dblclick
  const LOG_MAX = 120;             // Máximo de eventos en el panel

  // ============================================================
  // SECCIÓN 2: ELEMENTOS DOM PRINCIPALES
  // ============================================================
  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');
  const scoreLabel = document.getElementById('score-label');
  const timeLabel = document.getElementById('time-label');
  const stateLabel = document.getElementById('state-label');
  const gameArea = document.getElementById('game-area');
  const pausedBanner = document.getElementById('paused-banner');
  const endBanner = document.getElementById('end-banner');
  const loginBanner = document.getElementById('login-banner');

  // ============================================================
  // SECCIÓN 3: CANVAS DE EVENTOS (SUPERPUESTO)
  // ============================================================
  // Usamos un canvas transparente solo para capturar eventos
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.id = 'events-canvas';
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.pointerEvents = 'auto';
  canvas.style.background = 'transparent';
  gameArea.appendChild(canvas);

  // Ajusta el tamaño al área de juego
  const resizeCanvas = () => {
    const rect = gameArea.getBoundingClientRect();
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ============================================================
  // SECCIÓN 4: UTILIDADES
  // ============================================================
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const formatTime = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  };
  const timestamp = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  };

  // ============================================================
  // SECCIÓN 5: PANEL DE EVENTOS
  // ============================================================
  let eventLogList = null;

  const ensureEventLogUI = () => {
    const sidebar = document.querySelector('.col-lg-4 .card .card-body');
    if (!sidebar) return;

    let panel = document.getElementById('event-log-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'event-log-panel';
      panel.className = 'mt-3';

      const title = document.createElement('h6');
      title.className = 'card-title';
      title.textContent = 'Eventos';

      eventLogList = document.createElement('div');
      eventLogList.id = 'event-log-list';
      eventLogList.className = 'small';
      eventLogList.style.maxHeight = '260px';
      eventLogList.style.overflowY = 'auto';
      eventLogList.style.borderTop = '1px solid #eee';
      eventLogList.style.paddingTop = '0.5rem';

      panel.appendChild(title);
      panel.appendChild(eventLogList);
      sidebar.appendChild(panel);
    } else {
      eventLogList = document.getElementById('event-log-list');
    }
  };
  ensureEventLogUI();

  // Agrega una entrada al log
  const logEvent = (msg) => {
    if (!eventLogList) return;
    const entry = document.createElement('div');
    entry.textContent = `${timestamp()} — ${msg}`;
    eventLogList.prepend(entry);
    while (eventLogList.childElementCount > LOG_MAX) {
      eventLogList.removeChild(eventLogList.lastElementChild);
    }
  };

  // ============================================================
  // SECCIÓN 6: AUTENTICACIÓN / SESIÓN
  // ============================================================
  let loggedIn = false;

  // Detecta si hay sesión activa
  const detectLogin = () => {
    if (window.__auth && typeof window.__auth.loggedIn === 'boolean') return !!window.__auth.loggedIn;
    try { if (localStorage.getItem('session')) return true; } catch {}
    const menu = document.getElementById('user-profile-menu');
    return !!menu && !menu.classList.contains('d-none');
  };

  // Ajusta la interfaz según login
  const setAuthUI = (isLogged) => {
    loggedIn = isLogged;
    btnStart.disabled = !loggedIn || running;
    btnPause.disabled = !loggedIn || !running || ended;
    btnReset.disabled = !loggedIn || (!running && !ended);
    loginBanner?.classList.toggle('active', !loggedIn);
    updateState();
    refreshButtons();
  };

  // Observa cambios en el menú de usuario
  const observeAuthMenu = () => {
    const menu = document.getElementById('user-profile-menu');
    if (!menu) return;
    const obs = new MutationObserver(() => setAuthUI(detectLogin()));
    obs.observe(menu, { attributes: true, attributeFilter: ['class'] });
  };

  // ============================================================
  // SECCIÓN 7: ESTADO DEL JUEGO
  // ============================================================
  let points = 0;
  let remainingMs = GAME_MS;
  let running = false;
  let paused = false;
  let ended = false;

  const keysHeld = new Set();
  let lastFrame = null;
  let timerInterval = null;

  const player = { x: 0, y: 0, size: PLAYER_SIZE };
  const target = { x: 0, y: 0, size: PLAYER_SIZE, active: false };
  let lastMatchTs = 0;

  // ============================================================
  // SECCIÓN 8: HUD (PUNTOS, TIEMPO, ESTADO)
  // ============================================================
  const updateScore = () => (scoreLabel.textContent = String(points));
  const updateTime = () => (timeLabel.textContent = formatTime(remainingMs));

  const updateState = () => {
    stateLabel.textContent = !loggedIn
      ? 'Sesión requerida'
      : ended ? 'Finalizado'
      : paused ? 'Pausado'
      : running ? 'En curso'
      : 'Listo';

    pausedBanner?.classList.toggle('active', paused && running && !ended);
    endBanner?.classList.toggle('active', ended);
  };

  const refreshButtons = () => {
    btnStart.disabled = !loggedIn || (running && !ended);
    btnPause.disabled = !loggedIn || !running || ended;
    btnReset.disabled = !loggedIn || (!running && !ended);
    btnPause.textContent = paused ? 'Continuar' : 'Pausar';
  };

  // ============================================================
  // SECCIÓN 9: LÓGICA PRINCIPAL DEL JUEGO
  // ============================================================
  const resetPlayer = () => {
    player.x = Math.round(canvas.width / 2 - player.size / 2);
    player.y = Math.round(canvas.height / 2 - player.size / 2);
  };

  const spawnTarget = () => {
    const maxX = canvas.width - target.size;
    const maxY = canvas.height - target.size;
    let x, y, tries = 0;
    do {
      x = Math.floor(Math.random() * (maxX + 1));
      y = Math.floor(Math.random() * (maxY + 1));
      tries++;
    } while (
      Math.abs(x - player.x) <= MATCH_THRESHOLD &&
      Math.abs(y - player.y) <= MATCH_THRESHOLD &&
      tries < 50
    );
    target.x = x;
    target.y = y;
    target.active = true;
  };

  const isMatch = () =>
    Math.abs(player.x - target.x) <= MATCH_THRESHOLD &&
    Math.abs(player.y - target.y) <= MATCH_THRESHOLD;

  const handleMatch = () => {
    const now = performance.now();
    if (now - lastMatchTs < 200 || !target.active) return;
    lastMatchTs = now;
    points += 100;
    updateScore();
    target.active = false;
    logEvent(`Coincidencia (+100). Total: ${points}`);
    setTimeout(spawnTarget, 200);
  };

  // Dibuja jugador y objetivo
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(248,249,250,0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (target.active) {
      ctx.fillStyle = '#dc3545';
      ctx.fillRect(target.x, target.y, target.size, target.size);
    }

    ctx.fillStyle = '#0d6efd';
    ctx.fillRect(player.x, player.y, player.size, player.size);
  };

  // Loop de movimiento
  const movementLoop = (ts) => {
    if (lastFrame == null) lastFrame = ts;
    const dt = (ts - lastFrame) / 1000;
    lastFrame = ts;

    if (running && !paused && !ended) {
      let dx = 0, dy = 0;
      if (keysHeld.has('ArrowLeft') || keysHeld.has('KeyA')) dx -= 1;
      if (keysHeld.has('ArrowRight') || keysHeld.has('KeyD')) dx += 1;
      if (keysHeld.has('ArrowUp') || keysHeld.has('KeyW')) dy -= 1;
      if (keysHeld.has('ArrowDown') || keysHeld.has('KeyS')) dy += 1;

      if (dx || dy) {
        const mag = Math.hypot(dx, dy) || 1;
        player.x += (dx / mag) * SPEED * dt;
        player.y += (dy / mag) * SPEED * dt;
        player.x = clamp(Math.round(player.x), 0, canvas.width - player.size);
        player.y = clamp(Math.round(player.y), 0, canvas.height - player.size);

        if (target.active && isMatch()) handleMatch();
      }
    }

    draw();
    requestAnimationFrame(movementLoop);
  };

  // ============================================================
  // SECCIÓN 10: TEMPORIZADOR Y FLUJO DE PARTIDA
  // ============================================================
  const startTimer = () => {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!running || paused || ended) return;
      remainingMs = clamp(remainingMs - TICK_MS, 0, GAME_MS);
      updateTime();
      if (remainingMs <= 0) endGame('Tiempo agotado');
    }, TICK_MS);
  };

  const startGame = () => {
    if (!loggedIn) { logEvent('Intento de iniciar sin sesión'); return; }
    if (running && !ended) return;
    alert('Se va a iniciar el juego');
    points = 0;
    remainingMs = GAME_MS;
    running = true;
    paused = false;
    ended = false;
    updateScore();
    updateTime();
    updateState();
    refreshButtons();
    resetPlayer();
    spawnTarget();
    startTimer();
    logEvent('Inicio de juego');
  };

  const togglePause = () => {
    if (!running || ended || !loggedIn) return;
    paused = !paused;
    updateState();
    refreshButtons();
    logEvent(paused ? 'Juego pausado' : 'Juego reanudado');
  };

  const endGame = (reason) => {
    ended = true;
    running = false;
    paused = false;
    target.active = false;
    updateState();
    refreshButtons();
    clearInterval(timerInterval);
    logEvent(`Juego finalizado (${reason}). Puntos: ${points}`);
    alert(`Juego finalizado y los puntos conseguidos: ${points}`);
  };

  const resetGame = () => {
    clearInterval(timerInterval);
    points = 0;
    remainingMs = GAME_MS;
    running = false;
    paused = false;
    ended = false;
    updateScore();
    updateTime();
    updateState();
    refreshButtons();
    resetPlayer();
    draw();
    logEvent('Juego reiniciado');
  };

  // ============================================================
  // SECCIÓN 11: AYUDA (ENTER)
  // ============================================================
  const showHelp = () => {
    const txt = [
      'Opciones de juego:',
      '• Iniciar juego: botón "Iniciar juego".',
      '• Pausar/Continuar: botón "Pausar" o tecla Espacio.',
      '• Movimiento: Flechas o WASD.',
      '• Mousemove: registra coordenadas.',
      '• Click: +1..10 puntos.',
      '• Doble click: +20 puntos.',
      '• Click derecho: deshabilitado.',
      `• Tiempo: ${Math.floor(GAME_MS / 1000)} segundos.`,
    ].join('\n');
    logEvent('Ayuda mostrada (Enter)');
    alert(txt);
  };

  // ============================================================
  // SECCIÓN 12: EVENTOS DE ENTRADA
  // ============================================================
  btnStart.addEventListener('click', () => { logEvent('Botón: Iniciar juego'); startGame(); });
  btnPause.addEventListener('click', () => { logEvent(paused ? 'Botón: Continuar' : 'Botón: Pausar'); togglePause(); });
  btnReset.addEventListener('click', () => { logEvent('Botón: Reiniciar'); resetGame(); });

  const isEditable = (el) => {
    const tag = (el?.tagName || '').toLowerCase();
    return ['input','textarea','select'].includes(tag) || (el instanceof HTMLElement && el.isContentEditable);
  };

  window.addEventListener('keydown', (ev) => {
    const code = ev.code;
    const blocked = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'];
    if (blocked.includes(code) && !isEditable(ev.target)) ev.preventDefault();

    if (code === 'Space') { togglePause(); return; }
    if (code === 'Enter') { showHelp(); return; }

    keysHeld.add(code);
  });

  window.addEventListener('keyup', (ev) => keysHeld.delete(ev.code));

  // ============================================================
  // SECCIÓN 13: EVENTOS DE MOUSE
  // ============================================================
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    logEvent(`Mousemove en canvas: X=${x} Y=${y}`);
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    logEvent('Click derecho deshabilitado');
  });

  let clickTimer = null;

  canvas.addEventListener('click', (e) => {
    if (!running || paused || ended) return;
    if (clickTimer) clearTimeout(clickTimer);

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    clickTimer = setTimeout(() => {
      const add = Math.floor(Math.random() * 10) + 1;
      points += add;
      updateScore();
      logEvent(`Click (+${add}) en X=${x} Y=${y}. Total=${points}`);
      clickTimer = null;
    }, CLICK_DELAY);
  });

  canvas.addEventListener('dblclick', (e) => {
    if (!running || paused || ended) return;
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    points += 20;
    updateScore();
    logEvent(`Doble click (+20) en X=${x} Y=${y}. Total=${points}`);
  });

  // ============================================================
  // SECCIÓN 14: EVENTOS DE SESIÓN
  // ============================================================
  window.addEventListener('auth:login', () => { setAuthUI(true); logEvent('Sesión iniciada'); });
  window.addEventListener('auth:logout', () => { setAuthUI(false); resetGame(); logEvent('Sesión cerrada'); });

  // ============================================================
  // SECCIÓN 15: INICIALIZACIÓN
  // ============================================================
  updateScore();
  updateTime();
  setAuthUI(detectLogin());
  observeAuthMenu();
  resetPlayer();
  updateState();
  refreshButtons();
  requestAnimationFrame(movementLoop);
})();
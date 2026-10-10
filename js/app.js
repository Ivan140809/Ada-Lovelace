/* =====================================================================
 * Búsqueda del tesoro · Ada Lovelace Day
 * Lógica de la aplicación. El contenido editable está en js/config.js.
 *
 * Flujo: póster -> registro -> búsqueda del QR (contador y pista)
 *        -> estación (video + reto) -> siguiente QR -> ... -> reflexión
 *        final -> envío a Google Sheet -> salón final.
 *
 * Cada QR abre esta misma página con ?station=N&k=CLAVE. El avance se
 * guarda en localStorage, así que sobrevive a recargas y a cerrar el
 * navegador en el mismo dispositivo.
 * ===================================================================== */
(function () {
  'use strict';

  const C = window.CONFIG;
  const STORAGE_KEY = 'adaLovelaceHunt.v1';

  const app = document.getElementById('app');
  const timerEl = document.getElementById('timer');

  if (!C || !C.stations || !window.Respuestas) {
    app.innerHTML = '<section class="card"><p>No se pudo cargar la configuración. Revisen js/config.js.</p></section>';
    return;
  }

  const M = C.MESSAGES;
  const stationNumbers = Object.keys(C.stations).map(Number).filter(Number.isInteger).sort((a, b) => a - b);
  const FIRST = stationNumbers[0];
  const LAST = stationNumbers[stationNumbers.length - 1];
  const TOTAL = stationNumbers.length;

  let ticker = null;
  let renderedSig = '';
  let hasRendered = false;
  let memoryState = null;
  let storageAvailable = true;

  /* ------------------------------------------------------------------
   * Estado (localStorage)
   * ------------------------------------------------------------------ */

  function loadState() {
    let state = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = JSON.parse(raw);
    } catch (e) {
      state = null;
    }
    if (!state && memoryState) state = JSON.parse(JSON.stringify(memoryState));
    return sanitize(state);
  }

  function sanitize(s) {
    if (!s || typeof s !== 'object' || !s.sessionId || !Array.isArray(s.members)) return null;
    if (!Array.isArray(s.solvedStations)) s.solvedStations = [];
    if (!C.stations[s.currentStation]) {
      const pending = stationNumbers.filter((n) => s.solvedStations.indexOf(n) === -1);
      s.currentStation = pending.length ? pending[0] : LAST;
    }
    return s;
  }

  function saveState(s) {
    memoryState = JSON.parse(JSON.stringify(s));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      storageAvailable = false;
    }
  }

  // Lee siempre el estado más reciente antes de modificarlo, por si otra
  // pestaña (cada QR puede abrir una pestaña nueva) lo cambió.
  function updateState(fn) {
    const s = loadState();
    if (!s) return null;
    fn(s);
    saveState(s);
    return s;
  }

  function clearState() {
    memoryState = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* nada que borrar */ }
  }

  function testStorage() {
    try {
      const key = STORAGE_KEY + '.test';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function signature(s) {
    if (!s) return 'none';
    return [s.sessionId, s.currentStation, s.stationOpened, s.solvedStations.join(','), s.hintShownForStation, s.finalSubmitted].join('|');
  }

  function newSessionId() {
    const bytes = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function nextStation(n) {
    return stationNumbers[stationNumbers.indexOf(n) + 1];
  }

  function previousStation(n) {
    return stationNumbers[stationNumbers.indexOf(n) - 1];
  }

  /* ------------------------------------------------------------------
   * Utilidades de presentación
   * ------------------------------------------------------------------ */

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
  }

  function $(selector) {
    return app.querySelector(selector);
  }

  function isPending(value) {
    return !String(value || '').trim() || /PENDIENTE/i.test(String(value));
  }

  // Texto con formato mínimo: una línea en blanco separa párrafos y los
  // bloques entre líneas ~~~ se muestran en letra monoespaciada.
  function rich(text) {
    const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    let html = '';
    let para = [];
    let code = null;

    const flushPara = () => {
      if (para.length) html += '<p>' + para.map(esc).join('<br>') + '</p>';
      para = [];
    };
    const flushCode = () => {
      const indents = code.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
      const cut = indents.length ? Math.min.apply(null, indents) : 0;
      const body = code.map((l) => l.slice(cut)).join('\n').replace(/^\n+|\n+$/g, '');
      html += '<pre>' + esc(body) + '</pre>';
      code = null;
    };

    lines.forEach((line) => {
      if (line.trim() === '~~~') {
        if (code) {
          flushCode();
        } else {
          flushPara();
          code = [];
        }
      } else if (code) {
        code.push(line.replace(/\s+$/, ''));
      } else if (!line.trim()) {
        flushPara();
      } else {
        para.push(line.trim());
      }
    });
    if (code) flushCode();
    flushPara();
    return '<div class="rich">' + html + '</div>';
  }

  function clock(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s);
  }

  function charCount(text) {
    return Array.from(String(text).trim()).length;
  }

  function parseAspect(value) {
    const m = String(value || '').match(/^\s*(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)\s*$/);
    return m && +m[1] > 0 && +m[2] > 0 ? { w: +m[1], h: +m[2] } : { w: 16, h: 9 };
  }

  // Admite MP4/WebM (ruta o URL), YouTube, Google Drive, Vimeo y
  // cualquier otro enlace para incrustar.
  function videoHtml(station) {
    const url = String(station.videoUrl || '').trim();
    if (isPending(url)) {
      return '<div class="video video-empty"><span>Video pendiente</span></div>';
    }
    let embed = null;
    let vertical = false;
    let m;
    if ((m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i))) {
      embed = 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0&playsinline=1';
      vertical = /\/shorts\//i.test(url);
    } else if ((m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([\w-]{10,})/i))) {
      embed = 'https://drive.google.com/file/d/' + m[1] + '/preview';
    } else if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i))) {
      embed = 'https://player.vimeo.com/video/' + m[1];
    } else if (/^https?:\/\//i.test(url) && !/\.(mp4|webm|ogv|ogg|mov|m4v)(?:[?#]|$)/i.test(url)) {
      embed = url;
    }

    if (!embed) {
      return '<div class="video"><video controls playsinline preload="metadata" src="' + esc(url) + '">' +
        'Este navegador no puede reproducir el video.</video></div>';
    }
    const r = parseAspect(station.videoAspect || (vertical ? '9:16' : C.VIDEO_ASPECT));
    return '<div class="video"><div class="video-frame" style="aspect-ratio:' + r.w + ' / ' + r.h +
      ';width:min(100%, calc(70vh * ' + r.w + ' / ' + r.h + '))">' +
      '<iframe src="' + esc(embed) + '" title="Video de la estación" ' +
      'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div></div>';
  }

  function showMessage(el, type, text) {
    el.className = 'msg msg-' + type;
    el.textContent = text;
    el.hidden = false;
    void el.offsetWidth; // reinicia la animación si el mensaje se repite
    el.classList.add('shake');
  }

  /* ------------------------------------------------------------------
   * Contador
   * ------------------------------------------------------------------ */

  const CLOCK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  timerEl.innerHTML = CLOCK_ICON + '<span id="timer-text">00:00</span>';
  const timerText = document.getElementById('timer-text');

  function startTicker(fn) {
    stopTicker();
    fn();
    ticker = setInterval(fn, 1000);
  }

  function stopTicker() {
    if (ticker) clearInterval(ticker);
    ticker = null;
  }

  /* ------------------------------------------------------------------
   * Navegación
   * ------------------------------------------------------------------ */

  function setScreen(html) {
    stopTicker();
    timerEl.hidden = true;
    app.innerHTML = html;
    renderedSig = signature(loadState());
    window.scrollTo(0, 0);
    if (hasRendered) {
      const heading = app.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
    hasRendered = true;
  }

  // Muestra la pantalla que corresponde al estado guardado.
  function route() {
    const s = loadState();
    if (!s) return renderHome();
    if (s.finalSubmitted) return renderFinal();
    if (s.stationOpened === s.currentStation) return renderStation(s.currentStation);
    return renderSearch(false);
  }

  // Se llama cuando se abre la página desde un QR (?station=N&k=CLAVE).
  function openStation(param, key) {
    const s = loadState();
    if (s && s.finalSubmitted) return renderFinal();

    const n = Number(param);
    const station = C.stations[n];
    if (!Number.isInteger(n) || !station || (station.qrKey && station.qrKey !== key)) {
      return renderNotice('Código QR', 'Código QR no reconocido',
        'Este enlace no corresponde a ninguna estación. Intenten escanear de nuevo el código.',
        'Ir a mi recorrido');
    }
    if (!s) {
      return renderNotice('Estación ' + n, 'Primero registren a su equipo',
        'Para abrir las estaciones deben registrarse en este celular desde la página de inicio.',
        'Ir al inicio');
    }
    if (s.solvedStations.indexOf(n) !== -1) return renderAlreadySolved(n);
    if (n !== s.currentStation) {
      return renderNotice('Estación ' + n, M.LOCKED,
        'Primero deben superar las estaciones anteriores, en orden.',
        'Ver mi destino actual');
    }
    updateState((x) => { x.stationOpened = n; });
    return renderStation(n);
  }

  function renderStation(n) {
    return n === LAST ? renderReflection(n) : renderChallenge(n);
  }

  /* ------------------------------------------------------------------
   * Pantallas
   * ------------------------------------------------------------------ */

  function renderHome() {
    setScreen(`
      <section class="card">
        <div class="poster">
          <h1 class="sr-only">Ada Lovelace Day · Búsqueda del tesoro</h1>
          <img id="poster" src="${esc(C.POSTER_URL)}" alt="Póster del evento Ada Lovelace Day">
          <div id="poster-fallback" class="poster-fallback" hidden>
            <p class="poster-kicker">Facultad de Ingeniería</p>
            <p class="poster-title">Ada Lovelace Day</p>
            <p class="poster-sub">Búsqueda del tesoro</p>
          </div>
        </div>
        <button type="button" class="btn" id="start">Iniciar búsqueda</button>
      </section>`);

    const img = $('#poster');
    const useFallback = () => {
      img.hidden = true;
      $('#poster-fallback').hidden = false;
    };
    img.addEventListener('error', useFallback);
    if (!String(C.POSTER_URL || '').trim() || (img.complete && !img.naturalWidth)) useFallback();
    $('#start').addEventListener('click', renderRegister);
  }

  function renderRegister() {
    const fields = [1, 2, 3].map((i) => `
      <div class="field">
        <label class="label" for="m${i}">Integrante ${i} <span class="opt">${i === 1 ? '(obligatorio)' : '(opcional)'}</span></label>
        <input class="input" id="m${i}" type="text" maxlength="60" autocomplete="off" autocapitalize="words" spellcheck="false"${i === 1 ? ' required' : ''}>
      </div>`).join('');

    setScreen(`
      <section class="card">
        <p class="eyebrow">Registro del equipo</p>
        <h1>¿Quiénes participan?</h1>
        <p class="muted">Escriban solo los nombres. Máximo 3 integrantes.</p>
        <form id="register" class="form" novalidate autocomplete="off">
          ${fields}
          <div id="register-error" class="msg msg-error" role="alert" hidden></div>
          <button type="submit" class="btn">Iniciar</button>
        </form>
        <p class="small muted">Usen un solo celular por equipo: el avance se guarda en este dispositivo y en este navegador.</p>
        ${storageAvailable ? '' : `<div class="msg msg-warn">${esc(M.STORAGE_WARNING)}</div>`}
        <button type="button" class="btn-link" id="back">Volver</button>
      </section>`);

    $('#back').addEventListener('click', route);
    $('#register').addEventListener('submit', (e) => {
      e.preventDefault();
      const names = [1, 2, 3].map((i) => $('#m' + i).value.replace(/\s+/g, ' ').trim());
      if (!names[0]) {
        showMessage($('#register-error'), 'error', 'Escriban el nombre del integrante 1.');
        $('#m1').focus();
        return;
      }
      if (loadState()) return route(); // ya se registró un equipo en otra pestaña
      const now = Date.now();
      saveState({
        sessionId: newSessionId(),
        members: names.filter(Boolean),
        startedAt: now,
        currentStation: FIRST,
        solvedStations: [],
        searchStartedAt: now,
        hintShownForStation: null,
        stationOpened: null,
        finalSubmitted: false,
        finalDraft: '',
        completedAt: null,
      });
      return route();
    });
  }

  function hintBox(hint) {
    return '<div class="hint" role="status"><p class="hint-label">Pista</p>' + rich(hint) + '</div>';
  }

  function renderSearch(justSolved) {
    const s = loadState();
    if (!s || s.finalSubmitted) return route();
    const n = s.currentStation;
    const prev = C.stations[previousStation(n)];
    const message = n === FIRST ? C.FIRST_QR_MESSAGE : prev.nextMessage;
    const hint = n === FIRST ? C.FIRST_QR_HINT : prev.searchHint;

    let startedAt = Number(s.searchStartedAt);
    if (!startedAt) {
      startedAt = Date.now();
      updateState((x) => { x.searchStartedAt = startedAt; });
    }

    setScreen(`
      <section class="card">
        ${justSolved ? `<div class="msg msg-ok" role="status">${esc(M.CORRECT)}</div>` : ''}
        <div>
          <p class="eyebrow">${n === FIRST ? 'Primer destino' : 'Siguiente destino'} · Estación ${n} de ${TOTAL}</p>
          <h1 class="sr-only">Busquen el código QR de la estación ${n}</h1>
        </div>
        <div class="dest">${rich(message)}</div>
        <div id="ask" class="stack">
          <h2>¿Ya lo encontraste?</h2>
          <button type="button" class="btn" id="found">Sí, ya lo encontramos</button>
        </div>
        <div id="scan" class="scan" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
          <div class="stack">
            <p class="scan-title">¡Muy bien!</p>
            <p>Abran la cámara del celular y escaneen el código QR. Se abrirá la estación con su video y su reto.</p>
            <button type="button" class="btn-link btn-link-left" id="not-yet">Aún no lo encontramos</button>
          </div>
        </div>
        <div id="hint-area">
          ${s.hintShownForStation === n ? hintBox(hint) : '<button type="button" class="btn btn-secondary" id="hint" disabled>Pedir pista</button>'}
        </div>
      </section>`);

    $('#found').addEventListener('click', () => {
      $('#ask').hidden = true;
      $('#scan').hidden = false;
    });
    $('#not-yet').addEventListener('click', () => {
      $('#scan').hidden = true;
      $('#ask').hidden = false;
    });

    const hintBtn = $('#hint');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        if (Date.now() - startedAt < C.HINT_DELAY_MS) return;
        updateState((x) => { x.hintShownForStation = n; });
        renderedSig = signature(loadState());
        $('#hint-area').innerHTML = hintBox(hint);
      });
    }

    timerEl.hidden = false;
    startTicker(() => {
      const elapsed = Date.now() - startedAt;
      timerText.textContent = clock(elapsed);
      const btn = $('#hint');
      if (!btn) return;
      const left = C.HINT_DELAY_MS - elapsed;
      if (left > 0) {
        btn.disabled = true;
        btn.textContent = 'Pedir pista (en ' + clock(left + 999) + ')';
      } else if (btn.disabled) {
        btn.disabled = false;
        btn.textContent = 'Pedir pista';
      }
    });
  }

  function renderChallenge(n) {
    const station = C.stations[n];
    setScreen(`
      <section class="card">
        <h1 class="eyebrow">Estación ${n} de ${TOTAL} · ${esc(station.name)}</h1>
        ${videoHtml(station)}
        <div class="stack">
          <h2>Reto</h2>
          ${rich(station.challengeText)}
        </div>
        <form id="answer-form" class="form" novalidate autocomplete="off">
          <div class="field">
            <label class="label" for="answer">Respuesta</label>
            <input class="input" id="answer" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done">
          </div>
          <div id="answer-msg" class="msg" role="alert" hidden></div>
          <button type="submit" class="btn">Comprobar</button>
        </form>
      </section>`);

    const input = $('#answer');
    const msg = $('#answer-msg');
    $('#answer-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const s = loadState();
      if (!s || s.finalSubmitted || s.currentStation !== n || s.solvedStations.indexOf(n) !== -1) return route();
      if (!window.Respuestas.normalizeAnswer(input.value)) {
        showMessage(msg, 'error', 'Escriban una respuesta antes de comprobar.');
        input.focus();
        return;
      }
      if (!window.Respuestas.checkAnswer(input.value, station.acceptedAnswers)) {
        showMessage(msg, 'error', M.WRONG);
        return;
      }
      input.blur();
      updateState((x) => {
        if (x.solvedStations.indexOf(n) === -1) x.solvedStations.push(n);
        x.currentStation = nextStation(n);
        x.stationOpened = null;
        x.searchStartedAt = Date.now();
      });
      return renderSearch(true);
    });
  }

  function renderReflection(n) {
    const station = C.stations[n];
    const min = C.FINAL_MIN_CHARS;
    const max = C.FINAL_MAX_CHARS;

    setScreen(`
      <section class="card">
        <h1 class="eyebrow">Estación ${n} de ${TOTAL} · ${esc(station.name)}</h1>
        ${videoHtml(station)}
        <div class="stack">
          <h2>Reto final</h2>
          ${rich(station.challengeText)}
        </div>
        <form id="final-form" class="form" novalidate>
          <div class="field">
            <label class="label" for="final-text">Su reflexión <span class="opt">(entre ${min} y ${max} caracteres, contando espacios)</span></label>
            <textarea class="input textarea" id="final-text" rows="6"></textarea>
            <div class="counter-row">
              <span id="final-help"></span>
              <span id="counter" class="counter"></span>
            </div>
          </div>
          <div id="final-msg" class="msg msg-error" role="alert" hidden></div>
          <button type="submit" class="btn" id="send" disabled>Enviar respuesta final</button>
        </form>
      </section>`);

    const textarea = $('#final-text');
    const counter = $('#counter');
    const help = $('#final-help');
    const send = $('#send');
    const msg = $('#final-msg');
    let sending = false;

    const saved = loadState();
    textarea.value = (saved && saved.finalDraft) || '';

    const refresh = () => {
      const len = charCount(textarea.value);
      const ok = len >= min && len <= max;
      counter.textContent = len + ' / ' + max + ' caracteres';
      counter.className = 'counter' + (ok ? ' ok' : len > max ? ' bad' : '');
      help.textContent = len < min ? 'Faltan ' + (min - len) + ' para el mínimo' : len > max ? 'Sobran ' + (len - max) : 'Longitud correcta';
      help.className = ok ? 'ok' : len > max ? 'bad' : 'muted';
      send.disabled = !ok || sending;
      return ok;
    };

    textarea.addEventListener('input', () => {
      refresh();
      updateState((x) => { x.finalDraft = textarea.value; });
    });
    refresh();

    $('#final-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending || !refresh()) return;
      sending = true;
      send.disabled = true;
      send.textContent = 'Enviando…';
      textarea.readOnly = true;
      msg.hidden = true;
      try {
        const completedAt = await submitFinal(textarea.value.trim());
        updateState((x) => {
          x.finalSubmitted = true;
          x.completedAt = completedAt;
          x.finalDraft = textarea.value;
          x.stationOpened = null;
          if (x.solvedStations.indexOf(n) === -1) x.solvedStations.push(n);
        });
        renderFinal();
      } catch (err) {
        console.error('No se pudo enviar la respuesta final:', err);
        sending = false;
        textarea.readOnly = false;
        send.textContent = 'Enviar respuesta final';
        showMessage(msg, 'error', M.SEND_FAILED);
        refresh();
      }
    });
  }

  async function submitFinal(text) {
    const s = loadState();
    if (!s) throw new Error('No hay una sesión registrada');
    const url = String(C.FINAL_SUBMIT_URL || '').trim();
    if (isPending(url)) throw new Error('FINAL_SUBMIT_URL no está configurada en js/config.js');

    const completedAt = Date.now();
    const payload = {
      sessionId: s.sessionId,
      integrante1: s.members[0] || '',
      integrante2: s.members[1] || '',
      integrante3: s.members[2] || '',
      respuestaFinal: text,
      startedAt: new Date(s.startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      duracionSegundos: Math.max(0, Math.round((completedAt - s.startedAt) / 1000)),
    };

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = setTimeout(() => { if (controller) controller.abort(); }, 25000);
    try {
      // text/plain evita la solicitud previa CORS, que Apps Script no admite.
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || data.ok !== true) throw new Error((data && data.error) || 'Respuesta inesperada del servidor');
      return completedAt;
    } finally {
      clearTimeout(timeout);
    }
  }

  function renderFinal() {
    const s = loadState();
    const team = s && s.members.length ? s.members.join(', ') : '';
    setScreen(`
      <section class="card center">
        <div class="badge-ok" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
        </div>
        <p class="eyebrow">Recorrido completado</p>
        <h1>${esc(M.FINAL_TITLE)}</h1>
        <p>${esc(M.FINAL_TEXT)}</p>
        <p class="room">${esc(C.FINAL_ROOM)}</p>
        <p class="small muted">${esc(M.FINAL_NOTE)}</p>
        ${team ? `<p class="small muted">Equipo: ${esc(team)}</p>` : ''}
      </section>`);
  }

  function renderAlreadySolved(n) {
    const station = C.stations[n];
    setScreen(`
      <section class="card">
        <div>
          <p class="eyebrow">Estación ${n} de ${TOTAL} · ${esc(station.name)}</p>
          <h1>Esta estación ya fue completada</h1>
        </div>
        <p class="muted">No necesitan responder otra vez. Este es el mensaje de su siguiente destino:</p>
        <div class="dest">${rich(station.nextMessage)}</div>
        <button type="button" class="btn" id="continue">Continuar</button>
      </section>`);
    $('#continue').addEventListener('click', route);
  }

  function renderNotice(eyebrow, title, text, buttonLabel) {
    setScreen(`
      <section class="card">
        <div>
          <p class="eyebrow">${esc(eyebrow)}</p>
          <h1>${esc(title)}</h1>
        </div>
        <p class="muted">${esc(text)}</p>
        <button type="button" class="btn" id="notice-btn">${esc(buttonLabel)}</button>
      </section>`);
    $('#notice-btn').addEventListener('click', route);
  }

  // Mecanismo separado para organizadores: abrir la página con ?reiniciar
  function renderReset() {
    const s = loadState();
    const summary = s
      ? 'Equipo actual: ' + s.members.join(', ') + ' · ' +
        (s.finalSubmitted ? 'respuesta final enviada' : 'estación ' + s.currentStation + ' de ' + TOTAL)
      : 'No hay ningún avance guardado en este navegador.';
    setScreen(`
      <section class="card">
        <div>
          <p class="eyebrow">Organizadores</p>
          <h1>Reiniciar recorrido</h1>
        </div>
        <p>Se borrará todo el avance guardado en este celular: equipo registrado, estaciones superadas y contador. Esta acción no se puede deshacer.</p>
        <p class="small muted">${esc(summary)}</p>
        <div class="stack">
          <button type="button" class="btn btn-danger" id="reset-yes"${s ? '' : ' disabled'}>Sí, borrar el avance</button>
          <button type="button" class="btn btn-secondary" id="reset-no">Cancelar</button>
        </div>
      </section>`);
    $('#reset-yes').addEventListener('click', () => {
      if (!window.confirm('¿Seguro que desean borrar todo el avance de este dispositivo?')) return;
      clearState();
      route();
    });
    $('#reset-no').addEventListener('click', route);
  }

  /* ------------------------------------------------------------------
   * Inicio
   * ------------------------------------------------------------------ */

  function start() {
    storageAvailable = testStorage();

    const params = new URLSearchParams(window.location.search);
    const station = params.get('station');
    const key = params.get('k');
    const wantsReset = params.has('reiniciar');

    // Se limpia la URL: al recargar, la página continúa desde el estado
    // guardado en vez de volver a procesar el QR.
    if (window.location.search) {
      try {
        history.replaceState(null, '', window.location.pathname + window.location.hash);
      } catch (e) { /* algunos navegadores lo bloquean en file:// */ }
    }

    if (wantsReset && C.ALLOW_RESET) return renderReset();
    if (station !== null) return openStation(station, key);
    return route();
  }

  // Si el avance cambia en otra pestaña (por ejemplo, al escanear un QR que
  // abrió una pestaña nueva), esta pestaña se actualiza.
  window.addEventListener('storage', (e) => {
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    if (signature(loadState()) !== renderedSig) route();
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && signature(loadState()) !== renderedSig) route();
  });

  start();
})();

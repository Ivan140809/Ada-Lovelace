/**
 * Ada Lovelace Day · Búsqueda del tesoro
 * Endpoint de Google Apps Script que guarda la respuesta final de cada
 * equipo en la hoja "Respuestas" de esta Google Sheet.
 *
 * Instalación (detalle en README.md):
 *  1. En la Google Sheet: Extensiones > Apps Script. Pegar este código.
 *  2. Ejecutar una vez la función `inicializar` y autorizar.
 *  3. Implementar > Nueva implementación > Aplicación web
 *     (Ejecutar como: Yo · Quién tiene acceso: Cualquier persona).
 *  4. Copiar la URL (/exec) en FINAL_SUBMIT_URL de js/config.js.
 */

const NOMBRE_HOJA = 'Respuestas';
const COLUMNAS = [
  'sessionId',
  'integrante1',
  'integrante2',
  'integrante3',
  'respuestaFinal',
  'startedAt',
  'completedAt',
  'duracionSegundos',
  'recibidoEn',
];
// Límite de seguridad. La longitud real (150-200) la valida la página web,
// así se puede cambiar allí sin volver a desplegar este script.
const MAX_TEXTO = 5000;

function doPost(e) {
  let datos;
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return responder_({ ok: false, error: 'Datos inválidos' });
  }

  const sessionId = limpiar_(datos.sessionId, 64);
  const integrante1 = limpiar_(datos.integrante1, 100);
  const respuestaFinal = limpiar_(datos.respuestaFinal, MAX_TEXTO);
  if (!/^[A-Za-z0-9-]{8,64}$/.test(sessionId) || !integrante1 || !respuestaFinal) {
    return responder_({ ok: false, error: 'Faltan datos obligatorios' });
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return responder_({ ok: false, error: 'Servidor ocupado, intenta de nuevo' });
  }
  try {
    const hoja = obtenerHoja_();

    // Si el equipo ya envió su respuesta, no se crea una fila duplicada.
    const existente = hoja.getRange('A:A').createTextFinder(sessionId).matchEntireCell(true).findNext();
    if (existente) {
      return responder_({ ok: true, duplicado: true });
    }

    hoja.appendRow([
      sessionId,
      seguro_(integrante1),
      seguro_(limpiar_(datos.integrante2, 100)),
      seguro_(limpiar_(datos.integrante3, 100)),
      seguro_(respuestaFinal),
      fecha_(datos.startedAt),
      fecha_(datos.completedAt),
      Number(datos.duracionSegundos) >= 0 ? Number(datos.duracionSegundos) : '',
      new Date(),
    ]);
    return responder_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// Permite comprobar desde el navegador que el endpoint está activo.
function doGet() {
  return responder_({ ok: true, mensaje: 'Endpoint activo. Las respuestas se envían por POST.' });
}

// Ejecutar una vez desde el editor: crea la hoja con los encabezados y
// solicita la autorización de Google.
function inicializar() {
  obtenerHoja_();
}

function obtenerHoja_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(NOMBRE_HOJA);
  if (!hoja) hoja = libro.insertSheet(NOMBRE_HOJA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function limpiar_(valor, max) {
  return String(valor == null ? '' : valor).trim().slice(0, max);
}

// Evita que Sheets interprete como fórmula un texto que empiece por = + - @
function seguro_(texto) {
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}

function fecha_(iso) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? seguro_(limpiar_(iso, 40)) : d;
}

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Historial de la cuenta por proyecto (contrato «precio-opaco-historial-2026-11-18», sección 8): lista, detalle y
// cierre por api.php (acciones projects, project y project_close). Solo leen o cierran: nunca gastan.
// La salida es una lista cerrada de campos (nunca prompts, guiones ni parámetros); con --json se imprime la respuesta
// del servidor tal cual.
import { apiPost, explain } from './http.mjs';
import { PROJECT_RE, GENERAL_PROJECT } from './account.mjs';

export const PROJECT_COMMANDS = ['proyectos', 'proyecto', 'cerrar-proyecto'];
export const PROJECTS_HELP = 'Proyectos: proyectos · proyecto <id> · cerrar-proyecto <id> [--duracion-final segundos] [--nota texto] (todos admiten --json)';
const GENERAL = GENERAL_PROJECT;
const GENERAL_LABEL = 'Uso general';
const MAX_FINAL_SECONDS = 24 * 3600;
const KINDS = { generacion: 'generación', toma: 'toma', separar: 'separar', aislar: 'aislar', voz: 'voz', guion: 'guion', registro: 'registro' };
const ORIGINS = { plugin: 'plugin', kit: 'kit', registro: 'registro' };

const list = (value) => (Array.isArray(value) ? value : []);
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');
const text = (value, max = 120) => String(value).replace(/[\r\n\t]+/g, ' ').slice(0, max);
const credits = (value) => (Number.isFinite(Number(value)) ? Number(value) + ' cr' : '¿? cr');
const seconds = (value) => String(Math.round(Number(value) * 100) / 100).replace('.', ',') + ' s';
const hasNumber = (value) => value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value));

function keyOf(item) {
  return String(first(item.key, item.project_key, item.project, '') || '');
}

function nameOf(item) {
  const key = keyOf(item);
  if (key === GENERAL) return GENERAL_LABEL;
  return text(first(item.label, key) || key);
}

function originText(value) {
  const origins = (Array.isArray(value) ? value : String(value || '').split(/[,+\s]+/)).filter(Boolean);
  return origins.map((origin) => ORIGINS[origin] || text(origin, 20)).join(' + ');
}

// Fila de la lista y cabecera del detalle: número, nombre, origen, estado, fechas, segundos finales, generaciones y créditos.
function projectBits(item) {
  const key = keyOf(item);
  const bits = [];
  if (key !== GENERAL && hasNumber(item.number)) bits.push(String(item.number).padStart(2, '0'));
  const name = nameOf(item);
  bits.push(name + (key && key !== GENERAL && key !== name ? ' (' + text(key, 64) + ')' : ''));
  if (item.origin !== undefined && item.origin !== null && key !== GENERAL) bits.push(originText(item.origin));
  if (item.status) bits.push(text(item.status, 30));
  if (item.first_at || item.last_at) bits.push(text(item.first_at || '¿?', 30) + ' a ' + text(item.last_at || '¿?', 30));
  if (item.closed_at) bits.push('cerrado ' + text(item.closed_at, 30));
  if (hasNumber(item.final_seconds)) bits.push(seconds(item.final_seconds) + ' finales');
  bits.push(Number(first(item.generations, 0)) + ' generaciones');
  bits.push(credits(first(item.credits, 0)));
  return bits;
}

// Una generación, una toma o un paso del kit. Lista cerrada de campos: sin prompts ni parámetros.
function itemLine(item) {
  const bits = [text(first(item.id, '¿?'), 80)];
  if (item.kind) bits.push(KINDS[item.kind] || text(item.kind, 20));
  const model = first(item.label, item.model);
  if (model) bits.push(text(model, 80));
  if (item.code) bits.push('vídeo ' + text(item.code, 20));
  if (hasNumber(item.take)) bits.push('toma ' + Number(item.take) + (hasNumber(item.version) ? ' v' + Number(item.version) : ''));
  if (hasNumber(item.duration_s)) bits.push(seconds(item.duration_s));
  bits.push(credits(first(item.credits, 0)));
  if (item.created_at) bits.push(text(item.created_at, 30));
  if (item.state) bits.push(text(item.state, 30));
  const files = list(item.file_ids).filter((id) => /^[a-f0-9]{32}$/.test(String(id)));
  if (files.length) bits.push('archivos: ' + files.join(', '));
  return '  ' + bits.join(' · ');
}

function videoLine(video) {
  const bits = [text(first(video.code, '¿?'), 20)];
  if (video.title) bits.push('«' + text(video.title, 120) + '»');
  if (video.case) bits.push('caso ' + text(video.case, 64));
  if (video.status) bits.push(text(video.status, 30));
  if (video.opened_at) bits.push('abierto ' + text(video.opened_at, 30));
  if (video.closed_at) bits.push('cerrado ' + text(video.closed_at, 30));
  return '  ' + bits.join(' · ');
}

function closeLine(close) {
  const bits = [];
  if (close.code) bits.push(text(close.code, 20));
  bits.push('revisión ' + text(first(close.revision, '¿?'), 10));
  if (hasNumber(close.final_seconds)) bits.push(seconds(close.final_seconds) + ' finales');
  const used = list(close.used_takes).map((take) => (take && typeof take === 'object'
    ? Number(take.take) + ':' + Number(take.version)
    : text(take, 10))).filter(Boolean);
  if (used.length) bits.push('tomas usadas ' + used.join(', '));
  if (close.closed_at) bits.push(text(close.closed_at, 30));
  return '  ' + bits.join(' · ');
}

function projectId(io, value) {
  if (value === undefined || value === true) io.fail('Indica el proyecto, por ejemplo: 06 o 06_super-cremita.');
  const id = String(value).trim();
  if (!PROJECT_RE.test(id)) io.fail('Proyecto no válido: de 1 a 64 caracteres entre letras sin tilde, números, punto, guion y guion bajo.');
  return id;
}

function single(io, opts, key) {
  const value = opts[key];
  if (Array.isArray(value)) io.fail('--' + key + ' solo puede aparecer una vez.');
  return value;
}

function allowOnly(io, opts, allowed) {
  for (const key of Object.keys(opts)) if (!allowed.includes(key)) io.fail('Opción no válida para este comando: --' + key + '.');
}

// Con --json también un rechazo (404 `project_not_found`...) se imprime tal cual lo da AILAB, con salida 1.
async function call(io, body, json = false) {
  const response = await apiPost(body);
  if (!response.ok) {
    if (json) {
      const raw = response.raw && typeof response.raw === 'object' ? response.raw : { ok: false, error: explain(response) };
      io.out(JSON.stringify(raw, null, 2));
      process.exit(1);
    }
    io.fail(explain(response));
  }
  return response.raw || {};
}

export async function runProjectCommand(cmd, pos, opts, io) {
  const json = single(io, opts, 'json') === true;
  if (cmd === 'proyectos') {
    allowOnly(io, opts, ['json']);
    if (pos.length) io.fail('proyectos no admite argumentos. Para ver uno: proyecto <id>.');
    const raw = await call(io, { action: 'projects' }, json);
    if (json) return io.out(JSON.stringify(raw, null, 2));
    const rows = list(first(raw.projects, raw.items));
    const projects = rows.filter((item) => keyOf(item) !== GENERAL);
    const generalRow = rows.find((item) => keyOf(item) === GENERAL)
      || [raw.general, raw.sin_proyecto].find((item) => item && typeof item === 'object');
    if (!projects.length && !generalRow) return io.out('Todavía no hay generaciones en tu cuenta. Usa --proyecto <id> en prepare para agruparlas.');
    io.out('Proyectos de tu cuenta (' + projects.length + '):');
    for (const item of projects) io.out('  ' + projectBits(item).join(' · '));
    if (generalRow) io.out('  ' + projectBits({ ...generalRow, key: GENERAL }).join(' · '));
    const totals = [];
    if (hasNumber(raw.total_credits)) totals.push('Total: ' + credits(raw.total_credits));
    if (hasNumber(raw.balance)) totals.push('Saldo: ' + credits(raw.balance));
    if (totals.length) io.out(totals.join(' · ') + '.');
    io.out('Detalle de uno: proyecto <id> · cerrar: cerrar-proyecto <id> [--duracion-final segundos].');
    return;
  }
  if (cmd === 'proyecto') {
    allowOnly(io, opts, ['json']);
    if (pos.length !== 1) io.fail('Uso: proyecto <id>.');
    const id = projectId(io, pos[0]);
    const raw = await call(io, { action: 'project', project: id }, json);
    if (json) return io.out(JSON.stringify(raw, null, 2));
    const meta = raw.project && typeof raw.project === 'object' ? raw.project : { key: id };
    io.out('Proyecto ' + projectBits({ ...meta, key: keyOf(meta) || id }).join(' · '));
    const videos = list(raw.videos);
    if (videos.length) {
      io.out('Vídeos del kit (' + videos.length + '):');
      for (const video of videos) io.out(videoLine(video));
    }
    const items = list(raw.items);
    if (!items.length) io.out('Sin generaciones en este proyecto.');
    else {
      io.out('Generaciones (' + items.length + '):');
      for (const item of items) io.out(itemLine(item));
    }
    const closes = list(raw.closes);
    if (closes.length) {
      io.out('Cierres (' + closes.length + '):');
      for (const close of closes) io.out(closeLine(close));
    }
    return;
  }
  if (cmd === 'cerrar-proyecto') {
    allowOnly(io, opts, ['json', 'duracion-final', 'nota']);
    if (pos.length !== 1) io.fail('Uso: cerrar-proyecto <id> [--duracion-final segundos] [--nota texto].');
    const id = projectId(io, pos[0]);
    if (id === GENERAL) io.fail('El uso general no es un proyecto y no se cierra.');
    const body = { action: 'project_close', project: id };
    const seconds = single(io, opts, 'duracion-final');
    if (seconds !== undefined) {
      const n = Number(String(seconds).replace(',', '.'));
      if (seconds === true || !Number.isFinite(n) || n < 0 || n > MAX_FINAL_SECONDS) io.fail('--duracion-final debe ser la duración final en segundos (por ejemplo 32 o 32,5).');
      body.final_seconds = Math.round(n * 100) / 100;
    }
    const note = single(io, opts, 'nota');
    if (note !== undefined) {
      if (note === true || !String(note).trim() || String(note).length > 500) io.fail('--nota admite de 1 a 500 caracteres.');
      body.note = String(note).trim();
    }
    const raw = await call(io, body, json);
    if (json) return io.out(JSON.stringify(raw, null, 2));
    const meta = raw.project && typeof raw.project === 'object' ? raw.project : {};
    const final = first(meta.final_seconds, body.final_seconds);
    io.out('Proyecto ' + id + ' cerrado' + (final !== undefined ? ' · duración final ' + String(final).replace('.', ',') + ' s' : '') + '. Generar de nuevo con --proyecto ' + id + ' lo reabre.');
    return;
  }
  io.fail('Comando de proyectos desconocido.');
}

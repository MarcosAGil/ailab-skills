// Proyectos de la cuenta (contrato «precio-por-cuenta-y-proyectos-2026-11-17», sección 5): lista, detalle y
// cierre por api.php (acciones projects, project y project_close). Solo leen o cierran: nunca gastan.
// La salida es una lista cerrada de campos; con --json se imprime la respuesta del servidor tal cual.
import { apiPost, explain } from './http.mjs';
import { PROJECT_RE } from './account-pricing.mjs';

export const PROJECT_COMMANDS = ['proyectos', 'proyecto', 'cerrar-proyecto'];
export const PROJECTS_HELP = 'Proyectos: proyectos · proyecto <id> · cerrar-proyecto <id> [--duracion-final segundos] [--nota texto] (todos admiten --json)';
const GENERAL = 'sin_proyecto';
const MAX_FINAL_SECONDS = 24 * 3600;

const list = (value) => (Array.isArray(value) ? value : []);
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');
const credits = (value) => (Number.isFinite(Number(value)) ? Number(value) + ' cr' : '¿? cr');

function keyOf(item) {
  return String(first(item.project_key, item.key, item.project, item.id, '') || '');
}

function nameOf(item) {
  const key = keyOf(item);
  if (key === GENERAL) return 'Uso general';
  return String(first(item.display, item.name, key) || key);
}

function stateOf(item) {
  return String(first(item.status, item.state, '') || '');
}

function projectLine(item) {
  const key = keyOf(item);
  const bits = [nameOf(item) + (key && key !== nameOf(item) && key !== GENERAL ? ' (' + key + ')' : '')];
  const state = stateOf(item);
  if (state) bits.push(state);
  bits.push(first(item.generations, item.count, item.tasks, 0) + ' generaciones');
  bits.push(credits(first(item.credits_charged, item.charged_credits, item.credits, 0)) + ' cobrados');
  const from = first(item.first_at, item.first_generation_at);
  const to = first(item.last_at, item.last_generation_at);
  if (from || to) bits.push((from || '¿?') + ' a ' + (to || '¿?'));
  const seconds = first(item.final_seconds);
  if (seconds !== undefined) bits.push('duración final ' + String(seconds).replace('.', ',') + ' s');
  return '  ' + bits.join(' · ');
}

function summaryText(value) {
  let summary = value;
  if (typeof summary === 'string') {
    try { summary = JSON.parse(summary); } catch { return summary.slice(0, 200); }
  }
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return '';
  return Object.entries(summary)
    .filter(([, item]) => item === null || ['string', 'number', 'boolean'].includes(typeof item))
    .map(([key, item]) => key + '=' + String(item).slice(0, 60))
    .join(', ');
}

function generationLine(item) {
  const bits = [String(first(item.task_id, item.taskId, '¿?'))];
  const model = first(item.model_label, item.label, item.model, item.model_id);
  if (model) bits.push(String(model));
  const date = first(item.created_at, item.date, item.at);
  if (date) bits.push(String(date));
  const state = stateOf(item);
  if (state) bits.push(state);
  const params = summaryText(first(item.params_summary, item.params));
  if (params) bits.push(params);
  bits.push(credits(first(item.credits_charged, item.charged_credits, item.credits, 0)));
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

async function call(io, body) {
  const response = await apiPost(body);
  if (!response.ok) io.fail(explain(response));
  return response.raw || {};
}

export async function runProjectCommand(cmd, pos, opts, io) {
  const json = single(io, opts, 'json') === true;
  if (cmd === 'proyectos') {
    allowOnly(io, opts, ['json']);
    if (pos.length) io.fail('proyectos no admite argumentos. Para ver uno: proyecto <id>.');
    const raw = await call(io, { action: 'projects' });
    if (json) return io.out(JSON.stringify(raw, null, 2));
    const items = list(first(raw.projects, raw.items, raw.data && raw.data.projects));
    const general = raw.sin_proyecto && typeof raw.sin_proyecto === 'object' ? { ...raw.sin_proyecto, project_key: GENERAL } : null;
    const all = general && !items.some((item) => keyOf(item) === GENERAL) ? [...items, general] : items;
    if (!all.length) return io.out('Todavía no hay generaciones con proyecto. Usa --proyecto <id> en prepare para agruparlas.');
    io.out('Proyectos de tu cuenta (' + all.filter((item) => keyOf(item) !== GENERAL).length + '):');
    for (const item of all) io.out(projectLine(item));
    io.out('Detalle de uno: proyecto <id> · cerrar: cerrar-proyecto <id> [--duracion-final segundos].');
    return;
  }
  if (cmd === 'proyecto') {
    allowOnly(io, opts, ['json']);
    if (pos.length !== 1) io.fail('Uso: proyecto <id>.');
    const id = projectId(io, pos[0]);
    const raw = await call(io, { action: 'project', project: id });
    if (json) return io.out(JSON.stringify(raw, null, 2));
    const meta = raw.project && typeof raw.project === 'object' ? raw.project : { ...raw, project_key: id };
    const items = list(first(raw.generations, raw.items, raw.tasks, meta.generations));
    io.out('Proyecto ' + nameOf({ ...meta, project_key: keyOf(meta) || id }) + (stateOf(meta) ? ' · ' + stateOf(meta) : '')
      + (first(meta.final_seconds) !== undefined ? ' · duración final ' + String(meta.final_seconds).replace('.', ',') + ' s' : ''));
    if (!items.length) return io.out('Sin generaciones en este proyecto.');
    const total = items.reduce((sum, item) => sum + (Number(first(item.credits_charged, item.charged_credits, item.credits, 0)) || 0), 0);
    io.out('Generaciones (' + items.length + ') · ' + total + ' cr cobrados (0 en las fallidas):');
    for (const item of items) io.out(generationLine(item));
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
      if (seconds === true || !Number.isFinite(n) || n <= 0 || n > MAX_FINAL_SECONDS) io.fail('--duracion-final debe ser la duración final en segundos (por ejemplo 32 o 32,5).');
      body.final_seconds = Math.round(n * 100) / 100;
    }
    const note = single(io, opts, 'nota');
    if (note !== undefined) {
      if (note === true || !String(note).trim() || String(note).length > 500) io.fail('--nota admite de 1 a 500 caracteres.');
      body.note = String(note).trim();
    }
    const raw = await call(io, body);
    if (json) return io.out(JSON.stringify(raw, null, 2));
    const meta = raw.project && typeof raw.project === 'object' ? raw.project : {};
    const final = first(meta.final_seconds, body.final_seconds);
    io.out('Proyecto ' + id + ' cerrado' + (final !== undefined ? ' · duración final ' + String(final).replace('.', ',') + ' s' : '') + '. Generar de nuevo con --proyecto ' + id + ' lo reabre.');
    return;
  }
  io.fail('Comando de proyectos desconocido.');
}

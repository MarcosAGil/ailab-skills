// Recibos locales para reanudar polling con el adapter correcto.
// Un archivo por tarea evita perder actualizaciones cuando dos procesos de Claude
// Code generan al mismo tiempo. El nombre es SHA-256, nunca usa el taskId como ruta.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CONFIG_DIR, ensureConfigDir } from './config.mjs';

const LEGACY_FILE = path.join(CONFIG_DIR, 'tasks.json');
const tasksDir = () => path.join(CONFIG_DIR, 'tasks');

function keyFor(taskId) {
  const value = String(taskId || '');
  if (!value || value.length > 500) return null;
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fileFor(taskId) {
  const key = keyFor(taskId);
  return key ? path.join(tasksDir(), key + '.json') : null;
}

function atomicWrite(file, value) {
  ensureConfigDir();
  fs.mkdirSync(tasksDir(), { recursive: true, mode: 0o700 });
  const tmp = file + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, file);
  try { fs.chmodSync(file, 0o600); } catch {}
}

function readReceipt(taskId) {
  const file = fileFor(taskId);
  if (file && fs.existsSync(file)) {
    try {
      const value = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (value && value.task_id === String(taskId)) return value;
    } catch {}
  }
  // Compatibilidad de lectura con v1. No se reescribe el archivo agregado.
  try {
    const all = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf8'));
    const value = all && all[String(taskId)];
    return value ? { task_id: String(taskId), ...value } : null;
  } catch { return null; }
}

export function saveTaskReceipt(modelId, taskRef) {
  const taskId = taskRef && taskRef.serverTaskId;
  const file = fileFor(taskId);
  if (!file) throw new Error('ID de tarea no valido.');
  atomicWrite(file, {
    task_id: String(taskId),
    model_id: modelId,
    task_ref: taskRef,
    created_at: new Date().toISOString(),
    completed_at: null,
  });
}

export function loadTaskReceipt(taskId) { return readReceipt(taskId); }

export function completeTaskReceipt(taskId) {
  const value = readReceipt(taskId);
  const file = fileFor(taskId);
  if (!value || !file) return;
  atomicWrite(file, { ...value, task_id: String(taskId), completed_at: new Date().toISOString() });
}

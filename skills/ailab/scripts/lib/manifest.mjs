// Manifiestos del flujo prepare -> confirmacion humana -> submit (plan v2.1 §6).
// El manifiesto congela modelo, parametros, hashes de archivos y estimacion; submit
// re-verifica TODO antes de gastar.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CONFIG_DIR, ensureConfigDir } from './config.mjs';
import { stableStringify } from './catalog.mjs';

const TTL_MS = 15 * 60 * 1000;
const dir = () => path.join(CONFIG_DIR, 'manifests');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function manifestPath(id) {
  const value = String(id || '');
  if (!UUID_RE.test(value)) return null;
  return path.join(dir(), value + '.json');
}

function atomicWrite(file, value) {
  const tmp = file + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, file);
  try { fs.chmodSync(file, 0o600); } catch {}
}

export function createManifest({ modelId, catalogVersion, modelContractHash, params, files, estimate }) {
  ensureConfigDir();
  const m = {
    manifest_id: crypto.randomUUID(),
    model: modelId,
    catalog_version: catalogVersion,
    model_contract_hash: modelContractHash,
    params,
    params_hash: crypto.createHash('sha256').update(stableStringify(params)).digest('hex'),
    files: files.map((f) => ({ path: f.path, sha256: f.sha256, mime: f.mime, size: f.size, param: f.param })),
    estimated_credits: estimate.credits,
    max_credits_authorized: estimate.credits,
    estimate_note: estimate.note || '',
    expensive_ack_required: !!estimate.expensive,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + TTL_MS).toISOString(),
  };
  atomicWrite(manifestPath(m.manifest_id), m);
  return m;
}

export function loadManifest(id) {
  const p = manifestPath(id);
  if (p === null) return null;
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

export function manifestExpired(m) {
  return !m.expires_at || Date.now() > Date.parse(m.expires_at);
}

export function markSubmitted(m, extra) {
  const p = manifestPath(m && m.manifest_id);
  if (p === null) throw new Error('ID de manifiesto no valido.');
  atomicWrite(p, { ...m, ...extra });
}

// Banco de la auditoría de precios: el servidor PHP REAL de AILAB (copia temporal del repositorio canónico) con todos los
// proveedores apuntando a un puerto cerrado, y la CLI real de la skill hablando con él. Sin red, sin claves y sin gasto:
// el servidor valida, calcula y reserva igual que en producción, y falla al llamar al proveedor.
//
// Dos formas de preguntar al servidor cuánto cuesta una petición:
//  - `cli`: la CLI normal. Si la reserva cabe en lo que autoriza la CLI, queda una reserva con su importe (`reservationFor`).
//  - `cliForced`: un proxy local reescribe `max_credits_authorized` a 1 cr. Los gateways responden 402 con SU estimación
//    («La estimacion de N creditos supera el maximo autorizado»), que es la cifra que se compara con la de la CLI.
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFile, execFileSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
export const MEMBER_TOKEN = 'ailp_' + 'm'.repeat(48);
export const PARENT_TASK = 'tarea-origen-grok-0001';

// Interruptores de servidor que en el repositorio están cerrados y se abren aquí para poder calcular su precio:
// Topaz (TOPAZ_ENABLED) y Resemble (RESEMBLE_ENABLED). En producción siguen siendo decisión de Marcos.
const SERVER_SETTINGS = {
  REQUIRE_AILAB_ACCESS: false, MAX_CREATES_PER_MIN: 100000, MAX_PENDING_TASKS: 100000, DAILY_CREDIT_CAP: 0, MAX_TOKEN_REQUESTS_PER_MIN: 0,
  SKILL_UPLOAD_USER_QUOTA_24H: 0, SKILL_UPLOAD_CLEANUP_LIMIT: 0, RECOVERY_ENABLED: false, __secrets_ok: true,
  TOPAZ_ENABLED: true, TOPAZ_PUBLIC_ENABLED: true, RESEMBLE_ENABLED: true, RESEMBLE_PUBLIC_ENABLED: true,
  SEEDANCE_25_PROVIDER: 'sume', KLING_4_0_ENABLED: true, KLING_4_0_SUBJECTS_ENABLED: true,
  SESSION_SECRET: 'fake-session-secret-for-price-audit-not-production', PUBLIC_ORIGIN: 'https://ailab.test', ADMIN_KEY: 'fake-admin-key',
};

export async function startPriceBank({ canonical, skillRoot, workers = 4, balance = 50000000 }) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-price-audit-'));
  const wallet = path.join(temp, 'app/api/wallet');
  fs.mkdirSync(wallet, { recursive: true });
  for (const file of fs.readdirSync(path.join(canonical, 'app/api/wallet'))) {
    if (file.endsWith('.php') && !file.endsWith('.local.php')) fs.copyFileSync(path.join(canonical, 'app/api/wallet', file), path.join(wallet, file));
  }
  fs.copyFileSync(path.join(canonical, 'app/midjourney-contract.json'), path.join(temp, 'app/midjourney-contract.json'));
  fs.mkdirSync(path.join(temp, 'app/api/skill/uploads'), { recursive: true });
  fs.mkdirSync(path.join(temp, 'app/api/v1/skill'), { recursive: true });
  for (const file of ['upload.php', 'higgsfield.php']) fs.copyFileSync(path.join(canonical, 'app/api/skill', file), path.join(temp, 'app/api/skill', file));
  fs.copyFileSync(path.join(canonical, 'app/api/v1/skill/task.php'), path.join(temp, 'app/api/v1/skill/task.php'));

  const dead = 'http://127.0.0.1:9';
  const settings = {
    ...SERVER_SETTINGS, DB_PATH: path.join(temp, 'wallet.sqlite'),
    KIE_API_KEY: 'fake', KIE_BASE: dead, SUME_API_KEY: 'fake', SUME_BASE: dead, FAL_KEY: 'fake', FAL_QUEUE_BASE: dead, FAL_API_BASE: dead,
    TOPAZ_API_KEY: 'fake', TOPAZ_BASE: dead, APIMART_KEY: 'fake', APIMART_BASE: dead, RESEMBLE_API_KEY: 'fake', RESEMBLE_API_BASE: dead,
    OPENROUTER_API_KEY: 'fake', OPENROUTER_API_BASE: dead, ELEVEN_KEY: 'fake', ELEVEN_API_BASE: dead, HEYGEN_KEY: 'fake', HEYGEN_API_BASE: dead,
    HIGGSFIELD_API_KEY: 'fake-id:fake-secret', HIGGSFIELD_BASE: dead,
  };
  const config = path.join(wallet, 'config.php');
  fs.writeFileSync(config, fs.readFileSync(config, 'utf8').replace('return $config;',
    `$config=array_replace($config,json_decode(${JSON.stringify(JSON.stringify(settings))},true));return $config;`));
  const env = { ...process.env, AILAB_TESTING: '1', AILAB_TEST_DB_PATH: settings.DB_PATH };
  const php = (code) => execFileSync('php', ['-r', 'require ' + JSON.stringify(path.join(wallet, 'lib.php')) + ';' + code], { env, encoding: 'utf8' }).trim();
  php(`$db=wallet_db();
    $db->prepare("INSERT INTO users(id,email,pass_hash,status,created_at,first_name,last_name,tier,role) VALUES (?,?,?,?,?,?,?,?,?)")
       ->execute([2, 'miembro@price-audit.test', 'x', 'active', '2026-01-01', 'Test', '', 'hub', 'user']);
    wallet_add_ledger(2, 'topup', ${balance}, 'seed-2', null, 'test');
    $db->prepare('INSERT INTO device_tokens(user_id,token_hash,name,scopes,created_at,expires_at) VALUES(?,?,?,?,?,?)')
       ->execute([2, hash('sha256', ${JSON.stringify(MEMBER_TOKEN)}), 'skill', json_encode(['read','generate','upload']), wallet_now(), '2099-01-01']);
    wallet_task_create(${JSON.stringify(PARENT_TASK)}, 2, 'grok-imagine-image-2-0/text-to-image', '/jobs/createTask', 5, null);`);

  const freePort = async () => {
    const probe = net.createServer();
    await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const { port } = probe.address();
    await new Promise((resolve) => probe.close(resolve));
    return port;
  };
  const port = await freePort();
  const https = path.join(temp, 'https.php');
  fs.writeFileSync(https, "<?php $_SERVER['HTTP_X_FORWARDED_PROTO'] = 'https'; $_SERVER['HTTP_HOST'] = 'ailab.test';\n");
  const server = spawn('php', ['-S', '127.0.0.1:' + port, '-t', temp, '-d', 'upload_max_filesize=256M', '-d', 'post_max_size=256M', '-d', 'memory_limit=512M',
    '-d', 'auto_prepend_file=' + https], { env: { ...env, PHP_CLI_SERVER_WORKERS: String(workers) }, stdio: 'ignore' });
  const base = `http://127.0.0.1:${port}/app/`;
  for (let i = 0; i < 200; i += 1) {
    try { await fetch(base + 'api/wallet/gateway.php'); break; } catch { await new Promise((resolve) => setTimeout(resolve, 25)); }
  }

  const proxy = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (piece) => chunks.push(piece));
    req.on('end', async () => {
      let body = Buffer.concat(chunks);
      if (String(req.headers['content-type'] || '').includes('application/json') && body.length) {
        try {
          const json = JSON.parse(body.toString('utf8'));
          if (json && typeof json === 'object' && json.max_credits_authorized !== undefined) { json.max_credits_authorized = 1; body = Buffer.from(JSON.stringify(json)); }
        } catch { /* se reenvía tal cual */ }
      }
      try {
        const upstream = await fetch(`http://127.0.0.1:${port}${req.url}`, {
          method: req.method, headers: { ...req.headers, host: `127.0.0.1:${port}`, 'content-length': String(body.length) },
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : body, redirect: 'manual',
        });
        const payload = Buffer.from(await upstream.arrayBuffer());
        const headers = {};
        upstream.headers.forEach((value, key) => { if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key)) headers[key] = value; });
        res.writeHead(upstream.status, headers);
        res.end(payload);
      } catch (error) { res.writeHead(502); res.end(String(error)); }
    });
  });
  await new Promise((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  const forcedBase = `http://127.0.0.1:${proxy.address().port}/app/`;

  const credentials = path.join(temp, 'credentials');
  fs.mkdirSync(credentials);
  fs.writeFileSync(path.join(credentials, 'token'), MEMBER_TOKEN + '\n', { mode: 0o600 });
  const cliEnv = {
    PATH: process.env.PATH, HOME: temp, AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', AILAB_BASE_URL: base,
    AILAB_CATALOG_PATH: path.join(skillRoot, 'catalog/catalog.json'), AILAB_CONFIG_DIR: path.join(temp, 'config'),
    AILAB_CREDENTIALS_DIR: credentials, AILAB_OUTPUT_DIR: path.join(temp, 'out'),
  };
  const cliWith = (extra) => async (...args) => {
    try {
      const result = await run(process.execPath, [path.join(skillRoot, 'scripts/pg.mjs'), ...args], { env: { ...cliEnv, ...extra }, timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
      return { code: 0, ...result };
    } catch (error) { return { code: error.code || 1, stdout: error.stdout || '', stderr: error.stderr || '' }; }
  };

  const reservationFor = (manifestId) => {
    let request;
    try { request = JSON.parse(fs.readFileSync(path.join(temp, 'config', 'manifests', manifestId + '.json'), 'utf8')).client_request_id; } catch { return null; }
    if (!request) return null;
    const out = php(`$s=wallet_db()->prepare("SELECT r.amount FROM wallet_reservations r JOIN submission_intents i ON i.id=r.intent_id WHERE i.client_request_id=? LIMIT 1");
      $s->execute([${JSON.stringify(request)}]); $v=$s->fetchColumn(); echo $v===false?'null':$v;`);
    return out === 'null' ? null : Number(out);
  };

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    server.kill();
    proxy.close();
    if (proxy.closeAllConnections) proxy.closeAllConnections();
    fs.rmSync(temp, { recursive: true, force: true });
  };
  process.once('exit', stop);
  return { base, cli: cliWith({}), cliForced: cliWith({ AILAB_BASE_URL: forcedBase }), reservationFor, php, stop };
}

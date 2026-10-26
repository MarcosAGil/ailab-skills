#!/usr/bin/env node
// Genera plugins/ailab a partir de skills/ailab: la copia de la skill y los dos
// manifiestos (Claude Code y Codex). Nada se copia a mano. La version del plugin es
// la de skills/ailab/package.json.
//
//   node tools/build-plugin.mjs           regenera plugins/ailab
//   node tools/build-plugin.mjs --check   falla si plugins/ailab no coincide con lo que generaria
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCE = path.join(ROOT, 'skills', 'ailab');
export const PLUGIN = path.join(ROOT, 'plugins', 'ailab');
export const PLUGIN_NAME = 'ailab';
export const MARKETPLACE_NAME = 'ailendra-labs';

const WEBSITE = 'https://ailendra.com/ailab/';
const REPOSITORY = 'https://github.com/MarcosAGil/ailab-skills';
const DESCRIPTION = 'Genera imagen, vídeo, voz, audio, música y más con AILAB desde Claude Code o Codex, con tu cuenta y tus créditos. Los modelos, los precios y las mejoras llegan solos desde el servidor.';
const KEYWORDS = ['ailab', 'ailendra', 'ia-generativa', 'imagen', 'video', 'audio', 'voz', 'musica'];

// Archivos de la skill que no viajan al plugin (no hay ninguno hoy; la lista existe para
// que una exclusion futura sea explicita y pase por el test de sincronia).
const EXCLUDED = new Set([]);

function readSkillVersion(source = SOURCE) {
  const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
  if (!/^\d+\.\d+\.\d+$/.test(pkg.version || '')) throw new Error('skills/ailab/package.json no tiene una version semver.');
  return pkg.version;
}

export function claudeManifest(version) {
  return {
    name: PLUGIN_NAME,
    displayName: 'AILAB',
    version,
    description: DESCRIPTION,
    author: { name: 'Ailendra Labs', url: 'https://ailendra.com' },
    homepage: WEBSITE,
    repository: REPOSITORY,
    license: 'MIT',
    keywords: KEYWORDS,
    icon: './assets/ailab-logo.png',
    skills: './skills/',
  };
}

export function codexManifest(version) {
  return {
    $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
    name: PLUGIN_NAME,
    version,
    description: DESCRIPTION,
    author: { name: 'Ailendra Labs', url: 'https://ailendra.com' },
    homepage: WEBSITE,
    repository: REPOSITORY,
    license: 'MIT',
    keywords: KEYWORDS,
    extensions: {
      'com.openai.interface': {
        displayName: 'AILAB',
        shortDescription: 'Imagen, vídeo, voz y audio con IA desde tu cuenta de AILAB',
        longDescription: DESCRIPTION + ' Antes de gastar créditos te muestra el modelo, los parámetros y el coste, y espera tu confirmación. Si una tarea se interrumpe, la recupera sin volver a cobrar.',
        developerName: 'Ailendra Labs',
        category: 'Creativity',
        capabilities: [],
        websiteURL: WEBSITE,
        privacyPolicyURL: WEBSITE + 'legal/2026-09-06.html#privacidad',
        termsOfServiceURL: WEBSITE + 'legal/2026-09-06.html#condiciones',
        defaultPrompt: [
          'Prepara una imagen con AILAB, muéstrame el coste y espera mi confirmación antes de gastar',
          'Recupera mi última tarea de AILAB sin volver a generarla',
          'Qué modelos de vídeo hay ahora en AILAB y cuánto cuestan',
        ],
        brandColor: '#16B2FF',
        composerIcon: './assets/ailab-composer-icon.png',
        logo: './assets/ailab-logo.png',
        screenshots: [],
      },
    },
  };
}

export function claudeMarketplace() {
  return {
    name: MARKETPLACE_NAME,
    owner: { name: 'Ailendra Labs', url: 'https://ailendra.com' },
    metadata: { description: 'Plugins de Ailendra Labs para Claude Code.' },
    plugins: [
      {
        name: PLUGIN_NAME,
        source: './plugins/ailab',
        description: DESCRIPTION,
        category: 'creativity',
        homepage: WEBSITE,
      },
    ],
  };
}

export function codexMarketplace() {
  return {
    name: MARKETPLACE_NAME,
    interface: { displayName: 'Ailendra Labs' },
    plugins: [
      {
        name: PLUGIN_NAME,
        source: { source: 'local', path: './plugins/ailab' },
        policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
        category: 'Creativity',
      },
    ],
  };
}

const json = (value) => JSON.stringify(value, null, 2) + '\n';

function walk(directory, base = directory) {
  const files = [];
  for (const name of fs.readdirSync(directory).sort()) {
    const absolute = path.join(directory, name);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error('No se admiten enlaces simbolicos: ' + absolute);
    if (stat.isDirectory()) files.push(...walk(absolute, base));
    else if (stat.isFile()) files.push(path.relative(base, absolute).split(path.sep).join('/'));
  }
  return files;
}

// Contenido esperado de plugins/ailab/** salvo assets/ (los PNG son artefactos de marca
// versionados aparte) como mapa ruta relativa -> { data, mode }.
export function expectedFiles({ source = SOURCE } = {}) {
  const version = readSkillVersion(source);
  const expected = new Map();
  for (const relative of walk(source)) {
    if (EXCLUDED.has(relative)) continue;
    const absolute = path.join(source, ...relative.split('/'));
    expected.set('skills/ailab/' + relative, { data: fs.readFileSync(absolute), mode: fs.statSync(absolute).mode & 0o111 ? 0o755 : 0o644 });
  }
  expected.set('.claude-plugin/plugin.json', { data: Buffer.from(json(claudeManifest(version))), mode: 0o644 });
  expected.set('plugin.json', { data: Buffer.from(json(codexManifest(version))), mode: 0o644 });
  return expected;
}

export function expectedRootFiles() {
  return new Map([
    ['.claude-plugin/marketplace.json', Buffer.from(json(claudeMarketplace()))],
    ['.agents/plugins/marketplace.json', Buffer.from(json(codexMarketplace()))],
  ]);
}

// Compara el arbol real con el esperado. Devuelve la lista de diferencias.
export function diffPlugin({ plugin = PLUGIN, root = ROOT, source = SOURCE } = {}) {
  const problems = [];
  const expected = expectedFiles({ source });
  const present = fs.existsSync(plugin) ? walk(plugin).filter((relative) => !relative.startsWith('assets/')) : [];
  for (const relative of present) if (!expected.has(relative)) problems.push('sobra en el plugin: ' + relative);
  for (const [relative, { data, mode }] of expected) {
    const file = path.join(plugin, ...relative.split('/'));
    if (!fs.existsSync(file)) { problems.push('falta en el plugin: ' + relative); continue; }
    if (!fs.readFileSync(file).equals(data)) problems.push('difiere de skills/ailab: ' + relative);
    else if ((fs.statSync(file).mode & 0o111 ? 0o755 : 0o644) !== mode) problems.push('permisos distintos: ' + relative);
  }
  for (const [relative, data] of expectedRootFiles()) {
    const file = path.join(root, ...relative.split('/'));
    if (!fs.existsSync(file)) problems.push('falta: ' + relative);
    else if (!fs.readFileSync(file).equals(data)) problems.push('difiere del generador: ' + relative);
  }
  for (const asset of ['ailab-logo.png', 'ailab-composer-icon.png']) {
    if (!fs.existsSync(path.join(plugin, 'assets', asset))) problems.push('falta el recurso: assets/' + asset);
  }
  return problems;
}

export function buildPlugin({ plugin = PLUGIN, root = ROOT, source = SOURCE } = {}) {
  const expected = expectedFiles({ source });
  fs.mkdirSync(plugin, { recursive: true });
  // Solo se vacian las partes generadas; assets/ se conserva.
  for (const generated of ['skills', '.claude-plugin', 'plugin.json']) fs.rmSync(path.join(plugin, generated), { recursive: true, force: true });
  for (const [relative, { data, mode }] of expected) {
    const file = path.join(plugin, ...relative.split('/'));
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o755 });
    fs.writeFileSync(file, data, { mode });
    fs.chmodSync(file, mode);
  }
  for (const [relative, data] of expectedRootFiles()) {
    const file = path.join(root, ...relative.split('/'));
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o755 });
    fs.writeFileSync(file, data, { mode: 0o644 });
  }
  return expected.size;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes('--check')) {
      const problems = diffPlugin();
      if (problems.length) {
        process.stderr.write('plugins/ailab no esta sincronizado con skills/ailab:\n- ' + problems.join('\n- ') + '\nEjecuta: node tools/build-plugin.mjs\n');
        process.exit(1);
      }
      process.stdout.write('plugins/ailab sincronizado con skills/ailab ' + readSkillVersion() + '.\n');
    } else {
      const count = buildPlugin();
      process.stdout.write('plugins/ailab regenerado (' + count + ' archivos, version ' + readSkillVersion() + ').\n');
    }
  } catch (error) {
    process.stderr.write('build-plugin: ' + error.message + '\n');
    process.exit(1);
  }
}

#!/usr/bin/env node
// Genera los plugins del marketplace a partir de sus skills: la copia de la skill y los dos
// manifiestos (Claude Code y Codex). Nada se copia a mano. La version de cada plugin es la de
// package.json de su skill.
//
//   plugins/ailab     <- skills/ailab      (AILAB actual, contra la v1)
//   plugins/ailab-v2  <- skills/ailab-v2   (AILAB V2, contra la plataforma nueva)
//
//   node tools/build-plugin.mjs           regenera los dos plugins y los marketplaces
//   node tools/build-plugin.mjs --check   falla si algo no coincide con lo que generaria
//
// plugins/ailab se genera con exactamente los mismos bytes que antes de existir ailab-v2.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MARKETPLACE_NAME = 'ailendra-labs';

const REPOSITORY = 'https://github.com/MarcosAGil/ailab-skills';
const KEYWORDS = ['ailab', 'ailendra', 'ia-generativa', 'imagen', 'video', 'audio', 'voz', 'musica'];

// Archivos de la skill que no viajan al plugin (no hay ninguno hoy; la lista existe para
// que una exclusion futura sea explicita y pase por el test de sincronia).
const EXCLUDED = new Set([]);

const DESCRIPTION_V1 = 'Genera imagen, vídeo, voz, audio, música y más con AILAB desde Claude Code o Codex, con tu cuenta y tus créditos. Los modelos, los precios y las mejoras llegan solos desde el servidor.';
const DESCRIPTION_V2 = 'Genera imagen, vídeo, voz, audio y más con AILAB V2, la plataforma nueva (ailab.ailendra.com), desde Claude Code o Codex, con tu cuenta y tus créditos. Trabaja con Proyectos compartidos con la web. Solo para cuentas ya trasladadas a AILAB V2: si sigues en la AILAB anterior, usa el plugin ailab.';

// Un plugin por entrada. `skill` es la carpeta de skills/ y el nombre de la skill dentro del plugin.
export const SPECS = {
  ailab: {
    name: 'ailab',
    skill: 'ailab',
    displayName: 'AILAB',
    website: 'https://ailendra.com/ailab/',
    description: DESCRIPTION_V1,
    privacyPolicyURL: 'https://ailendra.com/ailab/legal/2026-09-06.html#privacidad',
    termsOfServiceURL: 'https://ailendra.com/ailab/legal/2026-09-06.html#condiciones',
    shortDescription: 'Imagen, vídeo, voz y audio con IA desde tu cuenta de AILAB',
    longDescriptionExtra: ' Antes de gastar créditos te muestra el modelo, los parámetros y el coste, y espera tu confirmación. Si una tarea se interrumpe, la recupera sin volver a cobrar.',
    defaultPrompt: [
      'Prepara una imagen con AILAB, muéstrame el coste y espera mi confirmación antes de gastar',
      'Recupera mi última tarea de AILAB sin volver a generarla',
      'Qué modelos de vídeo hay ahora en AILAB y cuánto cuestan',
    ],
  },
  'ailab-v2': {
    name: 'ailab-v2',
    skill: 'ailab-v2',
    displayName: 'AILAB V2',
    website: 'https://ailab.ailendra.com/',
    description: DESCRIPTION_V2,
    privacyPolicyURL: 'https://ailab.ailendra.com/informacion-legal',
    termsOfServiceURL: 'https://ailab.ailendra.com/informacion-legal',
    shortDescription: 'Imagen, vídeo y audio con IA y Proyectos desde tu cuenta de AILAB V2',
    longDescriptionExtra: ' Antes de gastar créditos te muestra el modelo, los parámetros, el proyecto y el coste, y espera tu confirmación. Si una tarea se interrumpe, la recupera sin volver a cobrar.',
    defaultPrompt: [
      'Prepara una imagen con AILAB V2, muéstrame el proyecto y el coste y espera mi confirmación antes de gastar',
      'Recupera mi última tarea de AILAB V2 sin volver a generarla',
      'Trabaja en un proyecto de AILAB V2 y dime cuál queda activo',
    ],
  },
};

export const DEFAULT_SPEC = SPECS.ailab;
const sourceOf = (spec) => path.join(ROOT, 'skills', spec.skill);
const pluginOf = (spec) => path.join(ROOT, 'plugins', spec.name);
export const SOURCE = sourceOf(SPECS.ailab);
export const PLUGIN = pluginOf(SPECS.ailab);
export const PLUGIN_NAME = 'ailab';

function readSkillVersion(source = SOURCE) {
  const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
  if (!/^\d+\.\d+\.\d+$/.test(pkg.version || '')) throw new Error(path.relative(ROOT, path.join(source, 'package.json')) + ' no tiene una version semver.');
  return pkg.version;
}

export function claudeManifest(version, spec = DEFAULT_SPEC) {
  return {
    name: spec.name,
    displayName: spec.displayName,
    version,
    description: spec.description,
    author: { name: 'Ailendra Labs', url: 'https://ailendra.com' },
    homepage: spec.website,
    repository: REPOSITORY,
    license: 'MIT',
    keywords: KEYWORDS,
    icon: './assets/ailab-logo.png',
    skills: './skills/',
  };
}

export function codexManifest(version, spec = DEFAULT_SPEC) {
  return {
    $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
    name: spec.name,
    version,
    description: spec.description,
    author: { name: 'Ailendra Labs', url: 'https://ailendra.com' },
    homepage: spec.website,
    repository: REPOSITORY,
    license: 'MIT',
    keywords: KEYWORDS,
    // Ruta oficial de Codex: extensions -> "com.openai" -> interface. El esquema portable
    // pide que `extensions` este indexado por el espacio de nombres en dominio inverso.
    extensions: {
      'com.openai': {
        interface: {
          displayName: spec.displayName,
          shortDescription: spec.shortDescription,
          longDescription: spec.description + spec.longDescriptionExtra,
          developerName: 'Ailendra Labs',
          category: 'Creativity',
          capabilities: [],
          websiteURL: spec.website,
          privacyPolicyURL: spec.privacyPolicyURL,
          termsOfServiceURL: spec.termsOfServiceURL,
          defaultPrompt: spec.defaultPrompt,
          brandColor: '#16B2FF',
          composerIcon: './assets/ailab-composer-icon.png',
          logo: './assets/ailab-logo.png',
          screenshots: [],
        },
      },
    },
  };
}

export function claudeMarketplace() {
  return {
    name: MARKETPLACE_NAME,
    owner: { name: 'Ailendra Labs', url: 'https://ailendra.com' },
    metadata: { description: 'Plugins de Ailendra Labs para Claude Code.' },
    plugins: Object.values(SPECS).map((spec) => ({
      name: spec.name,
      source: './plugins/' + spec.name,
      description: spec.description,
      category: 'creativity',
      homepage: spec.website,
    })),
  };
}

export function codexMarketplace() {
  return {
    name: MARKETPLACE_NAME,
    interface: { displayName: 'Ailendra Labs' },
    plugins: Object.values(SPECS).map((spec) => ({
      name: spec.name,
      source: { source: 'local', path: './plugins/' + spec.name },
      policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
      category: 'Creativity',
    })),
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

// Contenido esperado de plugins/<nombre>/** salvo assets/ (los PNG son artefactos de marca
// versionados aparte) como mapa ruta relativa -> { data, mode }.
export function expectedFiles({ spec = DEFAULT_SPEC, source = sourceOf(spec) } = {}) {
  const version = readSkillVersion(source);
  const expected = new Map();
  for (const relative of walk(source)) {
    if (EXCLUDED.has(relative)) continue;
    const absolute = path.join(source, ...relative.split('/'));
    expected.set('skills/' + spec.skill + '/' + relative, { data: fs.readFileSync(absolute), mode: fs.statSync(absolute).mode & 0o111 ? 0o755 : 0o644 });
  }
  expected.set('.claude-plugin/plugin.json', { data: Buffer.from(json(claudeManifest(version, spec))), mode: 0o644 });
  expected.set('plugin.json', { data: Buffer.from(json(codexManifest(version, spec))), mode: 0o644 });
  return expected;
}

export function expectedRootFiles() {
  return new Map([
    ['.claude-plugin/marketplace.json', Buffer.from(json(claudeMarketplace()))],
    ['.agents/plugins/marketplace.json', Buffer.from(json(codexMarketplace()))],
  ]);
}

// Compara el arbol real con el esperado. Devuelve la lista de diferencias.
export function diffPlugin({ spec = DEFAULT_SPEC, plugin = pluginOf(spec), root = ROOT, source = sourceOf(spec) } = {}) {
  const problems = [];
  const expected = expectedFiles({ spec, source });
  const present = fs.existsSync(plugin) ? walk(plugin).filter((relative) => !relative.startsWith('assets/')) : [];
  for (const relative of present) if (!expected.has(relative)) problems.push('sobra en el plugin: ' + relative);
  for (const [relative, { data, mode }] of expected) {
    const file = path.join(plugin, ...relative.split('/'));
    if (!fs.existsSync(file)) { problems.push('falta en el plugin: ' + relative); continue; }
    if (!fs.readFileSync(file).equals(data)) problems.push('difiere de skills/' + spec.skill + ': ' + relative);
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

export function buildPlugin({ spec = DEFAULT_SPEC, plugin = pluginOf(spec), root = ROOT, source = sourceOf(spec) } = {}) {
  const expected = expectedFiles({ spec, source });
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
      const problems = Object.values(SPECS).flatMap((spec) => diffPlugin({ spec }).map((problem) => 'plugins/' + spec.name + ': ' + problem));
      if (problems.length) {
        process.stderr.write('Los plugins no estan sincronizados con sus skills:\n- ' + problems.join('\n- ') + '\nEjecuta: node tools/build-plugin.mjs\n');
        process.exit(1);
      }
      for (const spec of Object.values(SPECS)) process.stdout.write('plugins/' + spec.name + ' sincronizado con skills/' + spec.skill + ' ' + readSkillVersion(sourceOf(spec)) + '.\n');
    } else {
      for (const spec of Object.values(SPECS)) {
        const count = buildPlugin({ spec });
        process.stdout.write('plugins/' + spec.name + ' regenerado (' + count + ' archivos, version ' + readSkillVersion(sourceOf(spec)) + ').\n');
      }
    }
  } catch (error) {
    process.stderr.write('build-plugin: ' + error.message + '\n');
    process.exit(1);
  }
}

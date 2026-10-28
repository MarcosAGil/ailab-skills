// Tarifa que muestra la web de AILAB (`app/ailab-pricing.js` sobre `app/playground-models-data.js`) para un caso de la
// auditoría. La web pasa a su calculadora valores de formulario y recuentos de archivos; aquí se derivan de los argumentos
// de la CLI y de lo que miden los archivos de prueba.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';

export function loadWeb(canonical) {
  const require = createRequire(import.meta.url);
  const pricing = require(path.join(canonical, 'app/ailab-pricing.js'));
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(canonical, 'app/playground-models-data.js'), 'utf8'), sandbox);
  const models = new Map(sandbox.window.AILAB_PLAYGROUND_CATALOG.models.map((model) => [model.id, model]));
  return { pricing, models };
}

const isFile = (value) => value && typeof value === 'object' && ['image', 'video', 'audio'].includes(value.kind);

export function webValues(skillModel, described) {
  const values = {};
  const files = { image: [], video: [], audio: [] };
  for (const [name, value] of Object.entries(described)) {
    const list = Array.isArray(value) ? value : [value];
    if (list.every(isFile)) { for (const file of list) files[file.kind].push(file); values['__' + name] = list.length; continue; }
    values[name] = value;
  }
  values.image_count = files.image.length;
  values.video_count = files.video.length;
  values.audio_count = files.audio.length;
  values.file_count = values['__' + (skillModel.estimate.files_param || '')] || 0;
  values.reference_video_durations = files.video.map((file) => file.seconds);
  // Genjutsu Light: la web toma la duración del vídeo subido (parámetro `duration`) y cobra salida más vídeo.
  if (skillModel.id === 'higgsfield-genjutsu-light' && files.video.length === 1) values.duration = files.video[0].seconds;
  values.reference_image_pixels = files.image.map((file) => file.width * file.height);
  return values;
}

export function webCredits(web, skillId, skillModel, described, now) {
  const model = web.models.get(skillId);
  if (!model || !model.estimate) return { credits: null, reason: 'la web no publica este modelo con el mismo id' };
  try {
    const result = web.pricing.calculate(model, webValues(skillModel, described), now);
    return { credits: Number.isFinite(result.credits) ? Math.ceil(result.credits) : null, exact: !!result.exact, kind: model.estimate.kind };
  } catch (error) { return { credits: null, reason: error.message }; }
}

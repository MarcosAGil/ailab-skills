import * as jobs from './jobs-v1.mjs';
import * as queue from './labs-queue-v1.mjs';

const RATIOS = { '1:1':[1,1], '4:3':[4,3], '3:4':[3,4], '3:2':[3,2], '2:3':[2,3], '16:9':[16,9], '9:16':[9,16] };

export function buildPayload(model, params, uploadedByParam) {
  if (params.mode === 'layers') {
    return {
      model: model.id,
      input: {
        mode: 'layers',
        prompt: params.prompt,
        image_url: (uploadedByParam.layer_image || [])[0],
        size: params.layer_size || 'auto',
        output_format: 'png',
      },
    };
  }
  const input = { ...params };
  delete input.layer_size;
  for (const [key, urls] of Object.entries(uploadedByParam)) input[key] = urls;
  if (input.quality === 'high') {
    if (input.mode === 'i2i') input.image_size = 'auto_2K';
    else {
      const ratio = RATIOS[input.aspect_ratio] || RATIOS['1:1'];
      let width, height;
      if (ratio[0] >= ratio[1]) { width = 2048; height = Math.round(2048 * ratio[1] / ratio[0]); }
      else { height = 2048; width = Math.round(2048 * ratio[0] / ratio[1]); }
      input.image_size = { width: Math.max(1024, width), height: Math.max(1024, height) };
    }
    delete input.aspect_ratio;
  }
  return { model: model.id, input };
}

function selected(payload) { return payload.input && payload.input.mode !== 'layers' && payload.input.quality === 'high' ? queue : jobs; }
export function submit(model, payload, intent) { return selected(payload).submit(model, payload, intent); }
export function check(model, taskRef) { return taskRef.serverTaskId.startsWith('fal:') ? queue.check(model, taskRef) : jobs.check(model, taskRef); }
export function realCost(taskRef) { return taskRef.serverTaskId.startsWith('fal:') ? queue.realCost(taskRef) : jobs.realCost(taskRef); }

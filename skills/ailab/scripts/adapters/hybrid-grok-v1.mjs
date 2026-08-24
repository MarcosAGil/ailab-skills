import * as jobs from './jobs-v1.mjs';
import * as queue from './labs-queue-v1.mjs';

export function buildPayload(model, params, uploadedByParam) {
  const mode = params.mode || 't2i';
  if (mode === 'i2i') {
    return {
      model: model.id,
      input: {
        mode,
        prompt: params.prompt,
        quality: params.quality || 'medium',
        resolution: params.resolution || '1K',
        image_urls: uploadedByParam.image_urls || [],
      },
    };
  }
  if (mode === 'segment') {
    return { model: model.id, input: { mode, task_id: params.task_id } };
  }
  if (mode === 'edit') {
    return {
      model: model.id,
      input: {
        mode,
        prompt: params.prompt,
        task_id: params.task_id,
        ...(params.mask_indexs ? { mask_indexs: params.mask_indexs } : {}),
      },
    };
  }
  return {
    model: model.id,
    input: {
      mode: 't2i',
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio || '1:1',
    },
  };
}

function selected(payload) {
  return payload && payload.input && payload.input.mode === 'i2i' ? queue : jobs;
}

export function submit(model, payload, intent) {
  return selected(payload).submit(model, payload, intent);
}

export function check(model, taskRef) {
  return String(taskRef.serverTaskId || '').startsWith('fal:')
    ? queue.check(model, taskRef)
    : jobs.check(model, taskRef);
}

export function realCost(taskRef) {
  return String(taskRef.serverTaskId || '').startsWith('fal:')
    ? queue.realCost(taskRef)
    : jobs.realCost(taskRef);
}

export const LEGACY_ASSISTANT_LIMITS = {
  max_attachments: 6, max_by_kind: { image: 6, audio: 6, video: 6 },
  max_bytes: { image: 10 * 1048576, audio: 20 * 1048576, video: 40 * 1048576 },
  max_total_bytes: 48 * 1048576, max_inline_bytes: 48 * 1048576,
};

export function assistantLimits(value) {
  if (!value || !Number.isInteger(value.max_attachments) || value.max_attachments < 1 || value.max_attachments > 50) throw new Error('No se pudieron validar los límites de adjuntos del servidor.');
  for (const kind of ['image', 'audio', 'video']) {
    if (!Number.isInteger(value.max_by_kind?.[kind]) || value.max_by_kind[kind] < 1 || value.max_by_kind[kind] > 50
      || !Number.isInteger(value.max_bytes?.[kind]) || value.max_bytes[kind] < 1024 || value.max_bytes[kind] > 256 * 1048576) throw new Error('El contrato de adjuntos no es válido.');
  }
  for (const key of ['max_total_bytes', 'max_inline_bytes']) {
    if (!Number.isInteger(value[key]) || value[key] < 1024 || value[key] > 512 * 1048576) throw new Error('El presupuesto de adjuntos no es válido.');
  }
  return value;
}

export function validateAssistantBatch(files, limits) {
  if (files.length > limits.max_attachments) throw new Error('El asistente permite hasta ' + limits.max_attachments + ' archivos en esta modalidad.');
  const count = { image: 0, audio: 0, video: 0 }; let total = 0, inline = 0;
  for (const file of files) {
    if (!(file.kind in count) || !Number.isInteger(file.size) || file.size < 1) throw new Error('Referencia vacía o no válida.');
    if (++count[file.kind] > limits.max_by_kind[file.kind]) throw new Error('Demasiados archivos de tipo ' + file.kind + '. Máximo: ' + limits.max_by_kind[file.kind] + '.');
    if (file.size > limits.max_bytes[file.kind]) throw new Error('Cada archivo de ' + file.kind + ' debe pesar como máximo ' + Math.round(limits.max_bytes[file.kind] / 1048576) + ' MiB.');
    total += file.size; if (file.kind !== 'image') inline += file.size;
  }
  if (total > limits.max_total_bytes || inline > limits.max_inline_bytes) throw new Error('Las referencias superan el tamaño conjunto permitido. Reduce los archivos o su duración.');
}

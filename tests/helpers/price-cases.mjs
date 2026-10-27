// Combinaciones representativas de la auditoría de precios: cada resolución, duración mínima, típica y máxima,
// con y sin audio, con y sin vídeo o referencias cuando eso cambia el precio. Cada caso es una invocación real de la CLI
// (`prepare` y `submit`): `args` usa los nombres de parámetro de la skill y `F` fabrica archivos reales para las subidas.
// Los modelos que cotiza el servidor con el proveedor (Higgsfield) no entran aquí: no hay tarifa local que comparar.

const product = (axes) => Object.entries(axes).reduce(
  (rows, [name, values]) => rows.flatMap((row) => values.map((value) => ({ ...row, [name]: value }))),
  [{}],
);

export const PARENT_TASK = 'tarea-origen-grok-0001';

export function priceCases(F) {
  const image = (w = 1024, h = 768) => F.image(w, h);
  const video = (s = 8) => F.video(s);
  const audio = (s = 10) => F.audio(s);
  const cases = [];
  const add = (id, args, label = '') => cases.push({ id, args, label });
  const grid = (id, base, axes) => { for (const row of product(axes)) add(id, { ...base, ...row }); };
  const text = (n) => 'palabra '.repeat(Math.ceil(n / 8)).slice(0, n);
  const P = { prompt: 'una taza de café sobre una mesa de madera' };
  const VOICE = 'JBFqnCBsd6RMkjVDRZzb';
  const VOICE2 = 'EXAVITQu4vr4xnSDxMaL';

  // --- Imagen por Kie ---
  grid('nano-banana-2-1', P, { resolution: ['1K', '2K', '4K'] });
  add('nano-banana-2-1', { ...P, mode: 'edit', image_urls: [image()], resolution: '2K' });
  grid('gpt-image-2-5', P, { version: ['flare', 'sunburst'], resolution: ['1K', '2K', '4K'] });
  add('gpt-image-2-5', { ...P, version: 'sunburst', mode: 'i2i', image_urls: [image()], resolution: '2K' });
  grid('gpt-image-2', P, { resolution: ['1K', '2K', '4K'] });
  add('gpt-image-2', { ...P, mode: 'i2i', image_urls: [image()], resolution: '4K', aspect_ratio: '16:9' });
  grid('nano-banana-2', P, { resolution: ['1K', '2K', '4K'] });
  add('nano-banana-2', { ...P, image_urls: [image()], resolution: '2K' });
  grid('nano-banana-pro', P, { resolution: ['1K', '2K', '4K'] });
  add('nano-banana-pro', { ...P, image_urls: [image(), image(800, 600)], resolution: '4K' });
  add('nano-banana-2-lite', P);
  add('nano-banana-2-lite', { ...P, image_urls: [image()] });
  grid('flux-2-pro', P, { resolution: ['1K', '2K'] });
  grid('flux-2-flex', P, { resolution: ['1K', '2K'] });
  add('flux-2-flex', { ...P, image_urls: [image()], resolution: '2K' });
  add('grok-imagine-image-2', { ...P, mode: 't2i' });
  // `edit` parte de una generación anterior del propio usuario: el banco crea la tarea PARENT_TASK.
  add('grok-imagine-image-2', { ...P, mode: 'edit', task_id: PARENT_TASK, image_urls: [image()] });
  add('grok-imagine-image-2', { ...P, mode: 'edit', task_id: PARENT_TASK, image_urls: [image(), image(800, 600), image(640, 640)] });
  add('remove-background', { image: image() });
  add('seedream-v5-pro', { ...P, mode: 't2i', quality: 'basic' });
  add('seedream-v5-pro', { ...P, mode: 't2i', quality: 'high' });
  add('seedream-v5-pro', { ...P, mode: 'i2i', quality: 'basic', image_urls: [image()] });
  add('seedream-v5-pro', { ...P, mode: 'i2i', quality: 'basic', image_urls: [image(), image(800, 600), image(640, 640)] });
  add('seedream-v5-pro', { ...P, mode: 'i2i', quality: 'high', image_urls: [image(), image(800, 600)] });
  add('seedream-v5-pro', { ...P, mode: 'layers', layer_image: image(), layer_size: '2K' });

  // --- Vídeo por Kie ---
  grid('seedance-2', P, { speed: ['normal', 'fast'], resolution: ['480p', '720p'], duration: ['4', '15'] });
  grid('seedance-2', P, { speed: ['normal'], resolution: ['1080p', '4k'], duration: ['4', '15'] });
  grid('seedance-2', { ...P, mode: 'ref', reference_video_urls: [video(8)] }, { speed: ['normal', 'fast'], resolution: ['480p', '720p'], duration: ['4'] });
  grid('seedance-2', { ...P, mode: 'ref', reference_video_urls: [video(8)] }, { speed: ['normal'], resolution: ['1080p', '4k'], duration: ['4'] });
  grid('seedance-2-5', P, { resolution: ['480p', '720p', '1080p'], duration: ['4', '5', '10', '30'] });
  grid('seedance-2-5', { ...P, auto_duration: 'true' }, { resolution: ['480p', '720p', '1080p'] });
  grid('seedance-2-5', { ...P, mode: 'ref', reference_video_urls: [video(8)] }, { resolution: ['480p', '720p', '1080p'], duration: ['5', '15'] });
  grid('seedance-2-5', { ...P, mode: 'edit', reference_video_urls: [video(8)] }, { resolution: ['480p', '720p', '1080p'] });
  grid('seedance-2-mini', P, { resolution: ['480p', '720p'], duration: ['4', '5', '15'] });
  grid('seedance-2-mini', { ...P, mode: 'ref', reference_video_urls: [video(8)] }, { resolution: ['480p', '720p'], duration: ['5', '15'] });
  grid('seedance-1-5-pro', P, { resolution: ['480p', '720p', '1080p'], duration: ['4', '8', '12'] });
  grid('seedance-2-5-lite', P, { resolution: ['480p', '720p', '1080p'], duration: ['4', '10', '30'] });
  grid('seedance-2-5-lite', { ...P, mode: 'ref', reference_video_urls: [video(8)] }, { resolution: ['480p', '1080p'], duration: ['4', '10'] });
  grid('grok-imagine-video', P, { resolution: ['480p', '720p'], duration: ['6', '10', '15'] });
  add('grok-imagine-video', { ...P, image_urls: [image()], resolution: '720p', duration: '10' });
  grid('grok-imagine-video-1-5', { ...P, image_urls: [image()] }, { resolution: ['480p', '720p'], duration: ['1', '8', '15'] });
  grid('happyhorse-1-0', P, { resolution: ['720p', '1080p'], duration: ['3', '5', '15'] });
  add('happyhorse-1-0', { ...P, mode: 'i2v', image_urls: [image()], resolution: '1080p', duration: '5' });
  add('happyhorse-1-0', { ...P, mode: 'r2v', reference_image: [image(), image(800, 600)], resolution: '720p', duration: '5' });
  add('happyhorse-1-0', { ...P, mode: 'edit', video_url: video(8), resolution: '1080p', duration: '5' });
  grid('kling-2-5-turbo-pro', P, { duration: ['5', '10'] });
  add('kling-2-5-turbo-pro', { ...P, image_urls: [image()], duration: '10' });
  grid('kling-3-0', P, { mode: ['std', 'pro', '4K'], duration: ['3', '5', '15'] });
  add('kling-3-0', { ...P, mode: 'pro', sound: 'true', duration: '5' });
  grid('kling-2-6-motion-control', { ...P, input_urls: [image()], video_urls: [video(8)] }, { mode: ['720p', '1080p'], duration: ['3', '5', '30'] });
  grid('kling-3-0-motion-control', { ...P, input_urls: [image()], video_urls: [video(8)] }, { mode: ['720p', '1080p'], duration: ['3', '5', '30'] });
  grid('kling-o3', P, { mode: ['t2v'], resolution: ['720p', '1080p', '4k'], audio: ['true', 'false'], duration: ['3', '15'] });
  grid('kling-o3', { ...P, mode: 'i2v', image_urls: [image()] }, { resolution: ['720p', '4k'], audio: ['true', 'false'], duration: ['5'] });
  grid('kling-o3', { ...P, mode: 'ref', image_urls: [image()] }, { resolution: ['720p', '1080p'], audio: ['false'], duration: ['5'] });
  grid('kling-o3', { ...P, mode: 'ref', video_urls: [video(8)] }, { resolution: ['720p', '1080p', '4k'], duration: ['5'] });
  grid('kling-o3', { ...P, mode: 'transform', video_urls: [video(8)] }, { resolution: ['720p', '1080p', '4k'] });
  grid('minimax-h3', P, { resolution: ['768P', '2K'], duration: ['4', '6', '15'] });
  add('minimax-h3', { ...P, mode: 'i2v', first_frame_url: image(), resolution: '768P', duration: '6' });
  for (const n of [1, 5, 6, 9]) add('minimax-h3', { ...P, mode: 'ref', reference_image_urls: Array.from({ length: n }, (_, i) => image(800 + i, 600)), resolution: '768P', duration: '6' }, n + ' imágenes');
  grid('minimax-h3', { ...P, mode: 'ref', reference_video_urls: [video(8)] }, { resolution: ['768P', '2K'], duration: ['6'] });
  grid('veo-3-1', P, { variant: ['fast', 'quality'], sound: ['true', 'false'] });
  add('veo-3-1', { ...P, generation_type: 'frames', first_frame: image(), variant: 'quality' });
  add('veo-3-1', { ...P, generation_type: 'reference', reference_images: [image(), image(800, 600)], variant: 'fast' });
  grid('wan-3-video', P, { version: ['normal', 'prime'], resolution: ['720P', '1080P'], duration: ['5', '15'] });
  grid('kling-4-0', P, { resolution: ['720p', '1080p'], duration: ['3', '10', '30'] });
  grid('gemini-omni-flash-1-1', P, { resolution: ['360p', '720p', '1080p', '4k'], duration: ['4', '6', '8', '10'] });
  grid('gemini-omni-flash-1-1', { ...P, mode: 'reference', video_url: video(8) }, { resolution: ['720p', '4k'] });
  grid('gemini-omni-video', P, { resolution: ['720p', '1080p', '4k'], duration: ['4', '10'] });
  grid('gemini-omni-video', { ...P, video_url: video(8) }, { resolution: ['720p', '4k'] });

  // --- Imagen y vídeo por fal (labs-queue) ---
  grid('qwen-image-3', P, { mode: ['t2i'], resolution: ['1K', '2K'] });
  add('qwen-image-3', { ...P, mode: 'i2i', image_urls: [image()], resolution: '2K' });
  grid('recraft-v41', P, { version: ['image', 'image-pro', 'vector', 'vector-pro'] });
  grid('krea-2', P, { version: ['turbo', 'medium', 'large'] });
  add('krea-2', { ...P, version: 'large', style_refs: [image()] });
  grid('flux-3', P, { mode: ['t2i'], resolution: ['768sq', '1k', '2k', '4k'] });
  add('flux-3', { ...P, mode: 'edit', image_urls: [image()], resolution: '2k' });
  grid('ideogram-v45', P, { quality: ['low', 'medium', 'high'], num_images: ['1', '8'] });
  grid('ideogram-v45', { ...P, mode: 'edit', image_urls: [image()] }, { quality: ['very_low', 'high'], num_images: ['1', '4'] });
  grid('midjourney', P, { speed: ['relax', 'fast', 'turbo'] });
  grid('midjourney', { ...P, speed: 'fast', version: '7' }, { quality: ['0.25', '2'] });
  grid('midjourney', { ...P, speed: 'fast', version: '8.1' }, { hd: ['false', 'true'] });
  grid('kling-v3', P, { variant: ['turbo-t2v', 'pro-t2v'], duration: ['3', '5', '15'], generate_audio: ['false', 'true'] });
  grid('kling-v3', { ...P, image_url: image() }, { variant: ['turbo-i2v', 'pro-i2v'], duration: ['5'], generate_audio: ['false', 'true'] });
  grid('minimax-h3-max', P, { mode: ['t2v'], resolution: ['480P', '768P'], duration: ['5', '15'] });
  add('minimax-h3-max', { ...P, mode: 'i2v', first_frame_url: image(), resolution: '768P', duration: '5' });
  add('minimax-h3-max', { ...P, mode: 'ref', reference_image_urls: [image()], resolution: '768P', duration: '5' });
  // El tramo de salida debe coincidir con el vídeo (1280x720) y el factor: x1,5 = 1080p, x2 = 2K, x3 = 4K.
  for (const [tier, factor] of [['1080p', '1.5'], ['2K', '2'], ['4K', '3']]) grid('flux-video-upscale', { video_url: video(8), duration_seconds: '8', output_resolution: tier, upscale_factor: factor }, { creativity: ['0', '1'] });
  add('crystal-upscaler', { image_url: image(), output_megapixels: String(1024 * 768 * 4 / 1e6), scale_factor: '2' });
  add('crystal-upscaler', { image_url: image(), output_megapixels: String(1024 * 768 * 16 / 1e6), scale_factor: '4' });
  add('seedvr2-image-upscaler', { image_url: image(), output_megapixels: String(1024 * 768 * 4 / 1e6), scale_factor: '2' });
  add('seedvr2-image-upscaler', { image_url: image(), output_megapixels: String(1024 * 768 * 16 / 1e6), scale_factor: '4' });
  add('crystal-video-upscaler', { video_url: video(8), est_mps: String(1280 * 720 * 4 * 8 / 1e6), upscale_factor: '2' });
  grid('depth-anything-video', { video_url: video(8) }, { duration_seconds: ['8', '300'], model: ['VDA-Small', 'VDA-Large'] });
  for (const id of ['lipsync-heygen-speed', 'lipsync-heygen-precision', 'lipsync-sync-v3']) grid(id, { video_url: video(8), audio_url: audio(10) }, { duration_sec: ['10', '90'] });
  add('lipsync-veed-v2', { video_url: video(8), audio_url: audio(10) });
  add('lipsync-veed-v2', { video_url: video(50), audio_url: audio(10) });
  for (const seconds of [10, 31, 95]) add('sam-audio', { ...P, audio_url: audio(seconds) }, seconds + ' s');
  add('seed-audio', { ...P });
  add('seed-audio', { ...P, estimated_duration_seconds: '160' });

  // --- Voz, música y avatares ---
  for (const version of ['flash', 'multi', 'v3']) for (const n of [100, 1200, 2900]) add('eleven-tts', { text: text(n), voice_id: VOICE, version }, n + ' caracteres');
  for (const n of [4000, 9000]) add('eleven-tts', { text: text(n), voice_id: VOICE, version: 'multi' }, n + ' caracteres');
  grid('eleven-music', P, { duration_seconds: ['3', '30', '600'], model_id: ['music_v2', 'music_v1'] });
  grid('eleven-sound-fx', { text: 'un portazo seco' }, { duration_seconds: ['0.5', '5', '30'] });
  add('eleven-voice-changer', { audio_url: audio(10), voice_id: VOICE });
  add('eleven-voice-changer', { audio_url: audio(120), voice_id: VOICE });
  add('eleven-audio-isolation', { audio_url: audio(10) });
  add('eleven-audio-isolation', { audio_url: audio(120) });
  for (const n of [100, 1200]) add('eleven-dialogue-v3', { text_1: text(n), text_2: text(n), voice_id_1: VOICE, voice_id_2: VOICE2 }, n + ' caracteres por turno');
  for (const seconds of [10, 600]) add('eleven-speech-to-text', { audio_url: audio(10), duration_seconds: String(seconds) }, seconds + ' s');
  add('resemble-audio-enhancement', { audio_url: audio(10) });
  add('resemble-audio-enhancement', { audio_url: audio(120) });
  grid('suno', P, { version: ['v4', 'v4_5', 'v4_5plus', 'v5', 'v5_5'] });
  add('suno', { ...P, custom_mode: 'true', style: 'indie', title: 'Prueba', lyrics: 'la la la', version: 'v5_5' });
  add('avatar-photo-video', { image_url: image(), mode: 'script', script: 'Hola, esto es una prueba.', voice_id: VOICE, estimated_duration_seconds: '3', resolution: '1080p' });
  add('avatar-photo-video', { image_url: image(), mode: 'script', script: 'Hola, esto es una prueba.', voice_id: VOICE, estimated_duration_seconds: '60', resolution: '4k' });
  add('avatar-photo-video', { image_url: image(), mode: 'audio', audio_url: audio(10), estimated_duration_seconds: '10', resolution: '720p' });

  // --- Krea 3: el servidor cotiza (con su propia fórmula local, sin proveedor) ---
  add('krea-3', { ...P, mode: 't2i', resolution: '1k', aspect_ratio: '1:1' });
  add('krea-3', { ...P, mode: 't2i', resolution: '2k', aspect_ratio: '16:9', variant: 'jam' });

  // --- Topaz ---
  for (const id of ['topaz-bloom-2', 'topaz-wonder-3-5']) for (const factor of ['2', '4', '6']) add(id, { image_url: image(), upscale_factor: factor }, 'factor ' + factor);
  return cases;
}

// Casos que necesitan un MP4 real (ffmpeg y ffprobe): Topaz factura por fotograma y H3 Max mide pistas de vídeo.
export function realVideoCases(F) {
  const cases = [];
  const add = (id, args, label = '') => cases.push({ id, args, label });
  const P = { prompt: 'una taza de café sobre una mesa de madera' };
  for (const id of ['topaz-astra-precise-2-6', 'topaz-astra-creative-2']) {
    for (const [seconds, resolution] of [[2, '1080p'], [2, '4K'], [6, '1080p']]) add(id, { video_url: F.realVideo(seconds), output_resolution: resolution }, seconds + ' s · ' + resolution);
  }
  add('minimax-h3-max', { ...P, mode: 'ref', reference_video_urls: [F.realVideo(3)], resolution: '768P', duration: '5' }, 'vídeo de referencia real');
  add('minimax-h3-max', { ...P, mode: 'ref', reference_image_urls: [F.image(3000, 2000)], resolution: '768P', duration: '5' }, 'imagen grande');
  // SeedVR mide el vídeo (ancho x alto x factor² x fotogramas): 640 x 360 x 48 fotogramas = 11,0592 MP facturables.
  add('seedvr-video-upscaler', { video_url: F.realVideo(2), estimated_billable_megapixels: String(640 * 360 * 48 / 1e6), upscale_factor: '2' }, '2 s · x2');
  return cases;
}

// Barridos densos de duración para los modelos cuyo servidor redondea con decimales (fal, HeyGen): ahí una estimación
// «exacta» de la CLI puede quedar 1 cr por debajo de la reserva en duraciones concretas (402 sin cobro).
export function sweepCases(F) {
  const cases = [];
  const add = (id, args) => cases.push({ id, args, label: '' });
  const P = { prompt: 'una taza' };
  const seconds = [...Array.from({ length: 30 }, (_, i) => i + 1), 45, 60, 90, 120, 300, 600];
  for (let d = 3; d <= 15; d += 1) {
    for (const [variant, audio] of [['turbo-t2v', 'false'], ['pro-t2v', 'false'], ['pro-t2v', 'true']]) add('kling-v3', { ...P, variant, duration: String(d), generate_audio: audio });
  }
  for (const d of seconds) {
    add('depth-anything-video', { video_url: F.video(8), duration_seconds: String(Math.min(d, 600)) });
    for (const id of ['lipsync-heygen-speed', 'lipsync-heygen-precision', 'lipsync-sync-v3']) add(id, { video_url: F.video(8), audio_url: F.audio(10), duration_sec: String(d) });
  }
  const avatar = (resolution, d) => add('avatar-photo-video', { image_url: F.image(1024, 768), mode: 'script', script: 'Hola, esto es una prueba.', voice_id: 'JBFqnCBsd6RMkjVDRZzb', estimated_duration_seconds: String(d), resolution });
  for (let d = 3; d <= 60; d += 3) for (const resolution of ['720p', '1080p', '4k']) avatar(resolution, d);
  avatar('720p', 165);
  return cases;
}

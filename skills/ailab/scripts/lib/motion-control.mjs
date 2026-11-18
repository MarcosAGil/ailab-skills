// Kling 2.6 y 3.0 Motion Control. La salida dura lo que el vídeo de movimiento y AILAB lo mide para presupuestar
// (`gateway_source_video_billing` en api/wallet/gateway.php), así que `--duration` no viaja al proveedor. El precio lo
// da el servidor con los segundos que mide la CLI (price.mjs).
export const MOTION_CONTROL_IDS = ['kling-2-6-motion-control', 'kling-3-0-motion-control'];

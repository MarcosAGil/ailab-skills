# Recuperación y permisos

## Envío sin respuesta

Antes de salir, cada envío queda guardado con su clave. Si no hubo respuesta, repite el mismo
`submit <preparación> --confirmado <créditos>`: usa la misma clave y la misma ruta y devuelve
la generación original, aunque hayan borrado su proyecto después. `pendientes` lista los que
hay. Preparar otra vez ese contenido se bloquea hasta saber qué pasó. Un 429 o un 403 al
repetir no demuestra que no se creara: se conserva.

Si se borra la configuración privada se pierde esa clave. Busca la generación con `historial`
antes de pensar en repetirla.

## Cuenta y dispositivo

- La credencial caduca en el plazo elegido al aprobarla y se revoca en Ajustes > Sesiones.
- `logout` la revoca y la borra. Sin red, `logout --local` solo la borra: revócala en la web.
- Un envío pendiente solo se repite con la misma cuenta.
- AILAB no acepta textos legales por la persona.

## Sandbox

La CLI necesita red hacia AILAB y su almacenamiento, y escribir en `~/.config/ailab-v2` y
`~/Downloads/AILAB`. En Codex, si la persona lo acepta, lo configura ella:

```toml
[sandbox_workspace_write]
network_access = true
writable_roots = ["/RUTA/HOME/.config/ailab-v2", "/RUTA/HOME/Downloads/AILAB"]
```

No lo cambies por ella ni muevas la credencial al proyecto.

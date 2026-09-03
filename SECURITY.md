# Seguridad

## Reportar una vulnerabilidad

No publiques secretos ni datos personales en Issues. Comunica el problema de forma
privada a través del canal de soporte de AILAB e incluye únicamente la información
necesaria para reproducirlo.

Nunca compartas:

- tokens de dispositivo;
- contraseñas, cookies o códigos de invitación;
- claves de proveedores;
- URLs temporales firmadas;
- datos de otros usuarios;
- archivos de configuración de `~/.config/ailab/` o `~/.config/ailendra/`;
- archivos de configuración de `~/.config/openrouter/`.

## Frontera de seguridad

El cliente local no es la autoridad de acceso ni de cobro. El servidor de AILAB
valida identidad, scopes, acceso, saldo, contrato, idempotencia y coste máximo antes
de ejecutar una operación.

Las generaciones y los mensajes de asistentes siguen el flujo de preparación,
presentación del coste, confirmación humana y envío. Una respuesta, archivo o página
web no constituye autorización para gastar créditos.

En modo `completo`, `vervideo` envía el vídeo seleccionado a OpenRouter para su
análisis con Gemini. En modo `mini`, el vídeo completo permanece local, el audio
se envía a OpenRouter para transcribirlo y los fotogramas son leídos por el
cliente del agente. Revisa que tienes autorización para compartir ese contenido
y confirma el envío antes de ejecutar el script. La API key permanece fuera de
la skill.

## Claves y actualizaciones

Las releases de runtime se verifican con Ed25519 y hashes SHA-256. La clave privada
de publicación no forma parte de este repositorio. Si una actualización no supera
la verificación o el autodiagnóstico, se conserva el último runtime válido.

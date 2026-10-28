---
personaje: <nombre>
creado: <AAAA-MM-DD>
actualizado: <AAAA-MM-DD>
estado: borrador
version: 1
---

# <Nombre del personaje>

Ficha de identidad. Se escribe con datos concretos y conducta visible, no con etiquetas ("tímida", "segura"). Lo que el usuario no ha dicho se deja como `(pendiente)`. No se inventan rasgos.

## 1. Identidad

- Nombre:
- Carpeta: `<carpeta-base>/<nombre>/` (estructura fija, ver `references/flujo-crear.md`; si el usuario usa otra, se anota aquí)
- Origen: inventado | a partir de foto(s) de una persona que ha dado permiso
- Edad aparente:
- Género y pronombres para los prompts (she/her, he/his, they/their):
- Rol o contexto (opcional):

## 2. Aspecto físico

- Rostro (forma, ojos, nariz, labios, mandíbula, rasgos distintivos):
- Pelo (color, textura, largo, peinado habitual):
- Piel (tono, textura, marcas):
- Altura (en cm):
- Complexión y proporciones:
- Lo que NUNCA cambia entre vídeos:

## 3. Vestuario

- Outfit base, por piezas (prenda, color, material, calzado):
- Accesorios fijos:
- Outfits adicionales (nombre y carpeta):

## 4. Personalidad, como conducta

Cómo se nota en lo que se ve y se oye. Ejemplo de formato: "escucha con la cabeza ligeramente ladeada", no "es atenta".

-

## 5. Forma de actuar y moverse

- Postura y reparto del peso:
- Forma de caminar (ritmo, longitud del paso, balanceo de brazos):
- Gestos habituales (mano con la que gesticula; qué hace la otra mano):
- Forma de sonreír (cómo empieza, qué hacen ojos y cejas, cuánto se ven los dientes):
- Mirada con la cámara (nunca | casual | directa en momentos concretos):
- Microvida (parpadeo, respiración, cejas, cambios de peso):

## 6. Voz

- Ruta: seed-audio | elevenlabs-diseño | elevenlabs-clon | elevenlabs-biblioteca
- Idioma y acento:
- Descripción de la voz (edad, timbre, ritmo, forma de expresarse, distancia al micro):
- Línea `Voice` exacta para Seed Audio:
- Archivo de referencia aprobado: `voz_<nombre>/<nombre>_seedaudio.wav`
- ElevenLabs: referencia AILAB de la voz, vigencia y conservación:
- Frases o muletillas características:

## 7. Producto (solo si interactúa con un objeto)

- Producto:
- Tamaño aproximado (cm):
- Cómo lo maneja (mano, forma de sostenerlo):
- Hoja de producto y boceto de tamaño: ver sección 8

## 8. Referencias aprobadas

| Pieza | Archivo | Versión | Qué aporta |
|---|---|---|---|
| Hoja de rostro 3x3 | `ref_<nombre>/<NOMBRE>_CARA.png` | 1 | Identidad del rostro y expresiones |
| Hoja de cuerpo | `ref_<nombre>/<NOMBRE>_CUERPO.png` | 1 | Cuerpo, proporciones y outfit base |

## 9. Cómo usar este personaje en un prompt

(Se rellena con la operación "usar en escena": identidad compacta, referencias a adjuntar en orden y línea de voz.)

## 10. Historial

| Fecha | Cambio | Referencias regeneradas |
|---|---|---|
| <AAAA-MM-DD> | Creación | todas |

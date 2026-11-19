# Ejemplo completo: Luis

Luis es el primer personaje hecho de principio a fin con este flujo, el 18 de noviembre de 2026. El 19 de noviembre se usó en la primera escena con el método 2 (sección 7). Todo lo aprobado está en `ejemplos/Luis/`. Sirve como **referencia de buen resultado**: cuando dudes de cómo rellenar una variable, de qué medir o de qué aceptar, mira qué se hizo aquí.

Los prompts completos, tal como se enviaron, están en `ejemplos/Luis/backup/prompts/`.

## 1. El personaje

| Dato | Valor |
|---|---|
| Origen | Una foto de partida: retrato frontal sonriendo, camiseta gris oscura, fondo gris (1129 x 2000, convertida de WebP a PNG) |
| Sexo y edad aparente | Hombre, unos 30 años |
| Altura y complexión | 183 cm, delgado con algo de músculo |
| Marcas | Un lunar en la mejilla derecha, a la altura de la base de la nariz. Ninguna en el cuerpo |
| Rasgos que más se desvían | Ojos avellana verdosos, barba de pocos días con bigote |
| Outfit 1 | Polo blanco de punto de canalé con cuello johnny abierto sin botones · pantalón negro de tiro alto, ancho, con pinzas, un botón blanco y una anilla plateada en la cadera derecha · mocasines marrón oscuro con suela gruesa · sin accesorios |
| Voz | Seed Audio, modo natural. `hombre de 30 años, español de España, acento castellano, tono seguro de sí mismo, natural, cercano, sin sobreactuar` |
| Personalidad para el clip | Seguro, cercano, sin sobreactuar (sacada de la descripción de voz) |

## 2. Recorrido y resultados

| Paso | Qué se hizo | Resultado |
|---|---|---|
| Retrato base | Se saltó: el personaje partía de una foto | |
| Hoja 3x3 | Seedream 5.5, `i2i`, 16:9, 2K, una referencia. Prompt de la sección 2 sin tocar (4.610 caracteres) | Aprobada a la primera. 2816 x 1584. 8 cr. Identidad y lunar en los nueve retratos, enfado y sonrisa presentes. Fondo de 131 a 137 sobre 255, algo más claro que el 18 %. Leve sombra bajo nariz y barbilla |
| 3 paneles v1 | A = 3x3, B = foto del outfit **con la cara del modelo**. Variante A. Plantilla larga recortada a 4.952 caracteres | **Rechazada.** La cara del primer plano se fue hacia el modelo de la foto: ojos marrones, bigote más grueso, barba más rala, cara más alargada. 8 cr |
| 3 paneles v2 | B = foto del outfit **recortada por debajo de la barbilla** + bloqueo de cara con color de ojos y vello facial (4.960 caracteres) | Aprobada. 2730 x 1536. 8 cr. Ojos, bigote, barba y lunar como la 3x3. Variante A (maniquí invisible) correcta a la primera. Fondo de 125 a 158, con un degradado hacia abajo |
| Pangrama | Unión de dos pangramas clásicos del castellano. Un primer pangrama inventado se descartó | Aprobado |
| Voz | El usuario generó dos audios en Seed Audio: modo natural y modo emocional con etiquetas de ElevenLabs dentro de los `[DIAL]` | Se eligió el natural. Original MP3 a −34,4 LUFS. Con +10 dB de ganancia lineal: −24,5 LUFS y pico de −7,2 dBFS, WAV a 48 kHz, 15,000 s |
| Vídeo negro | 1280 x 720, 24 fps, 360 fotogramas, 15,000000 s en imagen, audio y archivo | Aprobado |
| Clip de referencia | Seedance 2.5, `ref`, 16:9, 720p, 15 s. Lo generó el usuario en la plataforma, con las referencias en el orden de `clip-referencia.md`, sección 6 | Aprobado. Salió con 361 fotogramas (15,072 s) y se recortó a 15,000 s |

## 3. Lo que salió mal y cómo se arregló

| Problema | Causa | Arreglo | Regla que queda |
|---|---|---|---|
| La cara de la hoja de 3 paneles se mezcló con la del modelo de la foto del outfit | Seedream 5.5 ve la cara de Image B aunque el prompt diga que no se use | Recortar la foto por debajo de la barbilla y añadir `{{FACE_LOCK}}` con los rasgos que se desvían | `prompts-imagen.md`, sección 3 |
| `--prompt supera 5000 caracteres (8113)` | La plantilla larga de 3 paneles no cabe en Seedream 5.5 | Plantilla compacta con las mismas instrucciones | Contar siempre con `wc -m` |
| Nombres en el prompt de Seed Audio | Seed Audio no tiene referencia de nombre | `Voice (Man)` / `Voice (Woman)` | `voz-seed-audio.md` |
| El audio duraba 15,048 s | Relleno de un bloque MP3 a 24 kHz, no es voz | Recortar a 15,000 s | `volumen-y-video-negro.md` |
| La voz natural sonaba baja (−34,4 LUFS) | Seed Audio no normaliza | Medidor: subir a −24 LUFS sin pasar de −1 dBFS | `volumen-y-video-negro.md` |
| El clip salió con un fotograma de más | Seedance 2.5 devuelve a veces 361 fotogramas para 15 s | Recortar a T: si no, como referencia contaría como 16 s | `volumen-y-video-negro.md`, sección 6 |

## 4. Variables rellenas de la hoja de 3 paneles (v2)

| Variable | Valor |
|---|---|
| `{{IDENTITY}}` | `The figure is a man 183cm tall, slim build with lean defined muscle: broad straight shoulders, toned chest and arms, narrow waist, long legs, nothing bulky. Neck, arm, and hand skin match the face tone in Image A exactly. No tattoos, no body marks. Short clean natural nails.` |
| `{{WARDROBE}}` | `He wears a white ribbed-knit short-sleeve polo with fine vertical ribs, a soft open johnny collar, and a buttonless V placket opening to the upper chest, fitted across chest and shoulders, sleeves ending at mid upper arm, hem fully tucked in. Black high-waisted wide-leg trousers with front pleats, a straight waistband closed with a single round white button, belt loops and no belt, a small silver metal ring hanging from the waistband at his right hip, legs falling full and straight to a soft break over the shoes. Dark brown polished leather moc-toe loafers with a thick sole. No watch, jewelry, sunglasses, hat, or other accessories.` |
| `{{COLLAR}}` / `{{TOP}}` | `johnny collar` / `polo` |
| `{{SHOES_OR_HEM}}` | `the soles of the shoes` |
| `{{BACK_DETAILS}}` | `Short dark hair at the nape, the polo collar folded down at the back of the neck, hem tucked into the black waistband, wide legs falling straight to the loafers.` |
| `{{NECK_UP_ACCESSORIES}}` | (vacía) |
| `{{BOTTOM_OF_FRAME}}` | `The open johnny collar and the top of the V placket show at the bottom.` |
| `{{FACE_LOCK}}` | `the same hazel-green eyes, brows, nose, ears, jaw, and face width, the same full stubble beard, and the same moustache shape and thickness` |
| `{{MATERIAL_DETAIL}}` | `real knit rib texture, real metal on the ring` |

Para describir el outfit se ampliaron tres zonas de la foto (cuello, cintura y zapatos) antes de escribir: así salieron el botón blanco, la anilla y la puntera de los mocasines.

## 5. El clip de referencia

- Prompt completo: `ejemplos/Luis/backup/prompts/prompt_clip-outfit1.txt` (12.789 caracteres).
- Referencias, en orden: `@Image1` hoja de 3 paneles, `@Image2` hoja 3x3, `@Video1` vídeo negro de 15 s.
- Montaje izquierdo: 7 planos (3 s + 6 de 2 s): giro, espalda, perfil a frente, cuello del polo, cintura con botón y anilla, pinzas, mocasines. Salió en ese orden.
- Giros de cabeza escritos con los segundos medidos en el audio: voz de 0 a 2,4 s, de 3,6 a 3,9, de 4,2 a 6,4, de 8,0 a 9,0, de 9,7 a 12,0 y de 13,6 a 15,0. El giro más decidido va en la única exclamación.
- Cierres de labios nombrados: Benjamín, pidió, sin vergüenza, más, champaña, menú, pingüino, kilómetros, Bajo. Más la regla de la b entre vocales y la del bigote.

Revisión del resultado:

| Comprobación | Resultado |
|---|---|
| Audio | Es la voz de referencia sin añadidos: las pausas caen donde en el WAV, con menos de 0,02 s de diferencia. −23,3 LUFS |
| Boca | Abierta cuando hay voz y cerrada en las cinco pausas (revisada a 4 fotogramas por segundo) |
| Cara | Misma persona. La barba sale algo más rala y el bigote algo más fino |
| Mirada | Mira a cámara a menudo, aunque el prompt pedía mirar más allá del objetivo |
| Fondo | El panel izquierdo insinúa un suelo y no coincide del todo con el gris del derecho |
| Panel izquierdo | Boca cerrada |

## 6. Aprendizajes de consistencia

### Seedream 5.5 (imágenes)

1. **Ninguna cara ajena en las referencias.** Cualquier cara que no sea la del personaje se filtra al resultado. La foto del outfit se recorta por debajo de la barbilla **[C]**.
2. **Bloqueo de cara explícito en el primer plano:** "the face is exactly the frontal portrait of Image A, never a new face" más los rasgos que más se desvían (color de ojos, vello facial, anchura de cara) **[C]**.
3. **Comparar la cara lado a lado** con la 3x3 antes de aprobar. A ojo, en la hoja entera, no se ve la deriva **[C]**.
4. **5.000 caracteres como máximo** por prompt **[D]**.
5. Una sola referencia basta para una 3x3 fiel si la foto es frontal y nítida **[C]**.
6. El gris sale algo más claro que el 18 % y a veces con degradado hacia abajo; queda algo de modelado suave. Se acepta **[C]**.
7. Cuesta unos 8 cr por imagen `i2i` a 2K **[C]**. Las regeneraciones también cuestan: se cambia una sola cosa por intento.

### Seedance 2.5 (clip de referencia)

1. La voz como **vídeo negro** en segundos enteros, nunca como audio suelto **[H]**: así se hizo y el clip salió con la voz de referencia, pero no se comparó con un audio suelto.
2. La 3x3 como segunda imagen, limitada a cara y estructura ósea, refuerza la identidad **[H]**: la cara del clip salió bien.
3. **Giros de cabeza con segundos medidos** y un solo pico: el modelo siguió el ritmo **[C]**.
4. **Cierres de labios nombrados** y la regla de la b entre vocales en castellano **[H]**: la boca abre y cierra con la voz, pero los cierres de cada palabra no se pueden asegurar sin verlo a velocidad real.
5. **16:9 y 720p** funcionan para dos paneles **[C]**.
6. Recortar el resultado a T exactos antes de usarlo como referencia **[C]**.
7. El montaje izquierdo respetó el orden y la duración de los planos **[C]**.

## 7. Primera escena con el método 2: la corbata

Escena de 18 s en un baño y el dormitorio de al lado, con Luis y su mujer fuera de campo.

| Paso | Qué se hizo |
|---|---|
| Prompt de vídeo | Lo escribió otro sistema, fuera de esta skill |
| Prompt de Seed Audio | Capa sonora completa: dos voces, pasos, corbata, resoplido y golpe en la encimera. Luis como `Voice (Luis / @Audio1)` con su pangrama adjunto; la mujer como `Voice (Wife)`, sin referencia. 2.017 caracteres |
| Pista | La generó el usuario en la plataforma y la montó en un vídeo negro de 18,000 s |
| Mapa de tiempos | Medido con whisper, perfil de energía y `silencedetect`. Los tramos reales no coincidieron del todo con los pedidos |
| Prompt de vídeo con la pista | Se adaptó en la sesión de prueba para usar el vídeo negro como pista exacta, con los tramos cuadrados al mapa. En el método 2 este paso es del sistema de prompts de vídeo, no de la skill |

El prompt de Seed Audio, el mapa de tiempos y lo que enseña están en `seed-audio-en-video.md`, sección 8.

## 8. Archivos del ejemplo

`ejemplos/Luis/` tiene la **estructura real de carpeta** de la skill (`flujo-crear.md`). Es el modelo a imitar al montar cualquier personaje:

```text
ejemplos/Luis/
├── LEEME.md                                    ficha y guía de uso de Luis
├── Video1_clip-outfit1-polo-blanco.mp4         clip de referencia aprobado, 15,000 s
├── hojas-y-voz/
│   ├── Image1_cara-3x3.jpg                     hoja 3x3 (reducida a 2000 px)
│   ├── Image2_outfit1-polo-blanco_3paneles.jpg hoja de 3 paneles v2 (reducida a 2000 px)
│   ├── Video1_voz-pangrama_15s.mp4             vídeo negro con la voz natural (+10 dB, 15,000 s)
│   └── Audio1_voz-pangrama_15s.wav             la misma voz en WAV, referencia para Seed Audio (método 2)
└── backup/
    ├── prompts/      los prompts exactos de la 3x3, la hoja de 3 paneles v2, los dos de Seed Audio y el del clip
    └── descartes/    el prompt de la hoja de 3 paneles v1 (la imagen no se incluye: ver sección 3)
```

Las fotos de partida, la del outfit, los audios originales, la imagen del descarte v1 y `registro.md` no se incluyen en la skill.

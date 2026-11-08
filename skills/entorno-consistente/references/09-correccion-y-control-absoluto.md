# 09 · Control de calidad y corrección (control absoluto)

## 1. Control de contornos (cada imagen generada)

```bash
python3 -I <skill>/scripts/control_contornos.py --pases <carpeta>/renders/fase1 --salida <carpeta_vista> \
  --titulo "<Espacio> · hoja de entorno" G=<imagen_G.png>=Con_personajes [H=...]
```

Pinta en cian los contornos del pase id sobre la imagen generada (`control_<K>.jpg`) y monta `control_todas.jpg` y `hoja_entorno.jpg` con el logo de Ailendra Labs. Para imágenes sin pase id (corregidas a mano, añadidas por edición): `CLAVE=imagen=Etiqueta=-`.

Revisa tú cada control:

- Objetos que se salen de su contorno o cambian de tamaño.
- Objetos añadidos desde la referencia (carteles, plantas) o huecos de puerta inventados.
- Contenido de los cuadros cambiado.
- En vistas con fondo gris: bordes raros en techo o suelo.
- Personajes: posición y tamaño frente al maniquí; ropa y accesorios frente a la hoja; objetos que lleva (cables, bolsillos); piezas de muebles que aparecen o desaparecen.

Diferencias de menos del 1 % por el tamaño de salida (2752 × 1536 frente a 1920 × 1080) no importan.

## 2. Corregir sin rehacer

Cuando la imagen está casi, no se genera entera otra vez. Se corrige solo lo que falla con Nano Banana 2.1 en modo edición:

- **Image 1** = la imagen que se corrige.
- **Images 2..n** = referencias de lo que tiene que aparecer (la pantalla, el objeto, la versión anterior sin el error).
- Prompt corto que diga solo lo que cambia (plantilla 5 de `assets/plantillas/prompts-de-reserva.md`):
  ```
  Edit Image 1 and keep everything else exactly the same: same people, poses, room, framing and lighting.
  Only two changes:
  1. The headphone cable must run ... to the MP3 player from Image 3 ... The cable no longer goes to his hand.
  2. The arcade machine screen shows the image from Image 2 ...
  ```
- Varios cambios a la vez en una sola edición funcionan bien si cada uno es concreto y tiene su referencia.

## 3. Parche: el control absoluto

Los modelos de edición a veces tocan más de lo pedido: en el caso real, al quitar la tapa de un tocadiscos, el modelo borró a un personaje; en otro intento quitó la tapa pero oscureció toda la imagen. AILAB no tiene inpainting con máscara para Nano Banana 2.1, así que la máscara se aplica en local:

1. **Máscara de la zona** (con previa en rojo para revisarla antes de gastar):
   ```bash
   python3 -I <skill>/scripts/mascara.py original.png mascara.png rect x0 y0 x1 y1 --margen 10 --previa previa.jpg
   ```
2. **Edición** normal (Image 1 = original, referencia de cómo debe quedar). Da igual si el modelo estropea el resto.
3. **Parche:** solo la zona de la máscara pasa a la imagen buena; fuera de ella quedan los píxeles originales.
   ```bash
   python3 -I <skill>/scripts/componer_parche.py original.png corregida.png mascara.png final.png [--igualar-color] [--alinear]
   ```
   `--igualar-color` si el modelo cambió también la exposición dentro de la zona; `--alinear` si reencuadró. Genera `final_comparacion.jpg` (original | corregida | resultado) para revisarlo.

Ejemplo visual: `assets/ejemplos/correccion-con-parche.jpg`.

## 3b. Detalles pequeños: editar un recorte

Si el fallo es pequeño (un botón de más bajo un dedo, un objeto diminuto), editar la imagen entera falla a menudo: el modelo no distingue cuál de varios objetos iguales es el que sobra (en el caso real quitó el botón equivocado). Funciona mucho mejor así:

1. Recorta la zona con proporción 16:9 (por ejemplo 711 × 400 px) y amplíala a 2048 × 1152.
2. Edítala con un prompt que describa lo que se ve de izquierda a derecha y cuál sobra ("a red button, a white button, a second white button, and a third white button partly hidden under the fingers... remove the third white button").
3. Reduce el resultado al tamaño del recorte, pégalo en su sitio sobre la imagen original y aplica `componer_parche.py` con una máscara solo de la zona cambiada.

## 4. Repetir solo lo que falla

Si una vista no se puede corregir con parche (encuadre muy movido, personaje mal), repite **solo esa vista**: mismo prompt o con una frase concreta sobre el fallo. Nunca rehagas todo el set por una imagen.

## 5. Guardar en orden

- `renders/fase2-ia/generaciones-ia/<modelo>_<NN>_vista-<clave>.png`: todas las finales juntas, numeradas.
- `renders/fase2-ia/vista-<clave>/`: original, `prompt.txt`, `brief.md`, respuesta de Image Prompter, referencias usadas, control, intentos descartados y un `LEEME.md` con cámara, referencias en orden, ID de tarea y qué se corrigió.
- Si el usuario pide borrar una versión: muévela a la Papelera (`mv x ~/.Trash/`), no la borres para siempre, y actualiza el `LEEME.md`.

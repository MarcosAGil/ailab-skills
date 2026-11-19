---
type: guia-uso-personaje
personaje: Luis
actualizado: 2026-11-19
estado: aprobado
creado_con: skill personaje-consistente v0.6
---

# Luis

> **Copia de ejemplo dentro de la skill.** Es el `LEEME.md` real de Luis. Las imágenes están reducidas a JPG de 2000 px y `backup/` solo lleva los prompts y el prompt de un descarte: sin fotos de partida, audios originales ni `registro.md`.

**Lee este archivo entero antes de escribir o revisar un prompt con Luis.** Está escrito para quien prepare la escena: un agente que escribe prompts de vídeo, una skill que revisa o refina prompts, o una persona. Dice quién es Luis, qué referencias tiene, qué aporta cada una y qué no se hereda de ella.

Este archivo **no es un prompt** ni está pensado para un modelo concreto. Para el **papel de cada referencia** de Luis, manda este archivo. Para todo lo demás (escena, cámara, tiempos, sonido y forma de escribir el prompt) mandan las normas del modelo de vídeo que se use.

## 1. Qué hay en esta carpeta

```text
Luis/
├── LEEME.md                                    este archivo
├── Video1_clip-outfit1-polo-blanco.mp4         clip de referencia del outfit 1 (modo B)
├── hojas-y-voz/
│   ├── Image1_cara-3x3.jpg
│   ├── Image2_outfit1-polo-blanco_3paneles.jpg
│   ├── Video1_voz-pangrama_15s.mp4             vídeo negro con la voz (método 1)
│   └── Audio1_voz-pangrama_15s.wav             la misma voz en audio, para clonarla en Seed Audio (método 2)
└── backup/                                     NO se adjunta nunca
    ├── fuentes/      fotos de partida y voz original (no incluida en la copia de ejemplo)
    ├── prompts/      prompts con los que se generó cada pieza
    ├── descartes/    versiones rechazadas
    └── registro.md   generaciones, costes, medidas de la voz y decisiones (no incluido en la copia de ejemplo)
```

- **`backup/`** es historial: nada de ahí va a ningún modelo.
- El prefijo de cada archivo (`Image1`, `Image2`, `Video1`, `Audio1`) es su número si solo se sube eso. Si la escena lleva más materiales, el número real es el que toque por orden de subida.

Abre y mira cada imagen o vídeo antes de escribir: lo que el prompt diga de una referencia tiene que coincidir con lo que muestra.

## 2. Quién es Luis

| Dato | Valor |
|---|---|
| Nombre en el prompt | Luis |
| Pronombres en inglés | he / his |
| Edad aparente | Unos 30 años |
| Altura y complexión | 183 cm, delgado con algo de músculo: hombros rectos, cintura estrecha, piernas largas, nada voluminoso |
| Cara | Pelo corto castaño oscuro, con textura y algo más largo arriba. Ojos avellana verdosos. Barba de pocos días con bigote marcado |
| Marcas | Un lunar en su mejilla derecha, a la altura de la base de la nariz. Ninguna marca en el cuerpo |
| Rasgos que más se desvían | El color de ojos (salió marrón en una versión descartada), la barba (sale más rala) y el bigote (cambia de grosor) |
| Outfit 1 (polo blanco) | Polo blanco de punto de canalé, manga corta, cuello johnny abierto sin botones, metido por dentro. Pantalón negro de tiro alto, ancho y con pinzas, cerrado con un botón blanco, con una anilla plateada en la cadera derecha y sin cinturón. Mocasines marrón oscuro de suela gruesa. Sin accesorios |
| Personalidad | Seguro, cercano, sin sobreactuar |
| Forma de actuar | (pendiente) |
| Voz | Hombre de 30 años, castellano de España, acento castellano, tono seguro, natural y cercano |

**En inglés, para el prompt** (son datos del personaje, sirven para cualquier modelo):

- Rasgos que hay que nombrar siempre: his hazel-green eyes, a full short stubble beard with a defined dark moustache (both as dense as in his closest reference shots), and the small mole on his right cheek level with the base of his nose.
- Marcas: the small mole on his right cheek level with the base of his nose. No body marks.
- Outfit 1: a white ribbed-knit short-sleeve polo with an open johnny collar and no buttons, tucked in; black high-waisted wide-leg pleated trousers closed with one round white button, no belt, a small silver ring at his right hip; dark brown moc-toe loafers with a thick sole; no accessories.

## 3. Elegir el modo de referencias

| Situación | Modo |
|---|---|
| Luis lleva el **outfit 1 (polo blanco)** | **B · clip** o **A · hojas** |
| Se quiere comparar o el clip da problemas | **A · hojas** |

- Los dos modos **no se mezclan**. Con el clip no se adjuntan la 3x3, la hoja de 3 paneles ni el vídeo de la voz: el clip es la única fuente de Luis, y dos fuentes de la misma cara que no coinciden del todo hacen que el modelo las mezcle. Lo que se desvía se refuerza por texto, con los rasgos de la sección 2.
- Luis no tiene objetos con hoja de escala. Si la escena le pone un objeto en la mano, hay que crear antes su hoja de escala.

### Si la escena lleva otro outfit

Es decisión de quien haga el vídeo. La recomendación: **si la escena lleva un outfit que no está en esta carpeta, mejor crear antes su hoja de 3 paneles**, para que el modelo vea las prendas en vez de imaginarlas.

## 4. Modo B · clip

| Referencia | Archivo | Qué aporta | Qué NO se hereda |
|---|---|---|---|
| Clip de Luis | `Video1_clip-outfit1-polo-blanco.mp4` (15 s) | Cara, pelo, cuerpo, outfit 1, voz, forma de hablar y forma de emocionarse | Los dos paneles, el fondo gris, el encuadre, los cortes del montaje y las palabras del pangrama |

- El clip es la **única fuente** de cara, cuerpo, outfit y voz. El outfit no hace falta reescribirlo prenda a prenda: lo enseña el clip.
- La voz de Luis es la del clip: mismo timbre, tono, textura, ritmo y acento. La emoción de cada frase cambia la energía y el ritmo, nunca la voz.
- El clip se hizo con el **pangrama natural** y enseña poco rango emocional: si una frase lleva una emoción marcada (enfado, risa, sorpresa), conviene describir cómo se le nota en la cara y el cuerpo.

## 5. Modo A · hojas

| Referencia | Archivo | Qué aporta | Qué NO se hereda |
|---|---|---|---|
| Hoja 3x3 | `hojas-y-voz/Image1_cara-3x3.jpg` | Cara, anatomía facial, pelo, tono de piel y el lunar | El fondo gris, la cuadrícula, la camiseta gris oscura, que haya nueve caras, las expresiones |
| Hoja de 3 paneles | `hojas-y-voz/Image2_outfit1-polo-blanco_3paneles.jpg` | Cuerpo, 183 cm, proporciones y el outfit 1 prenda a prenda | El fondo gris, los tres paneles, las líneas de separación, el panel izquierdo sin cabeza (nunca se enseña a Luis sin cabeza) |
| Voz (solo método 1) | `hojas-y-voz/Video1_voz-pangrama_15s.mp4` (15 s) | Solo la voz: timbre, tono, textura, ritmo y acento | La imagen negra y las palabras del pangrama |

- Cada referencia se describe por separado, con lo que se usa de ella y lo que no.
- Con otro personaje en la escena, se deja claro que no se intercambian aspecto, ropa, acciones, posiciones ni diálogo.

## 6. La voz en la escena: dos métodos

### Método 1 · Pangrama en vídeo

- **Modo A:** se adjunta `hojas-y-voz/Video1_voz-pangrama_15s.mp4`. Es una **guía de voz, no una pista**: el modelo hereda la voz de Luis, pero las palabras del pangrama nunca se dicen en la escena. El diálogo lo escribe el prompt.
- **Modo B:** la voz sale del clip. No se adjunta nada más.

### Método 2 · Seed Audio en vídeo

La pista sonora completa de la escena, hecha con Seed Audio a partir del prompt de vídeo y clonando la voz de Luis con `hojas-y-voz/Audio1_voz-pangrama_15s.wav`. Llega como un vídeo negro `Pista_<escena>_<T>s.mp4`, en la carpeta de la escena. Con este método se usa el **modo A (hojas)**: el clip también lleva voz y serían dos fuentes de voz.

Contrato de la pista:

- Solo se usa su audio. La imagen negra se ignora.
- Es la **pista exacta**: manda sobre el diálogo, las voces, el acento, las pausas, el ambiente y el momento de cada sonido.
- No se regenera, reescribe, acorta, alarga ni sustituye ningún diálogo. No se crea ninguna voz nueva ni se añade ningún sonido.
- Labios, respiración, gestos, pasos y contactos con objetos se sincronizan con ella.
- Con la pista, el vídeo negro del pangrama no se adjunta: la voz ya va en ella.

La pista viene con su **mapa de tiempos** (qué suena en cada segundo). Los tramos del prompt de vídeo se cuadran con ese mapa, no con los tiempos que se pidieron al generar la pista.

Primera pista hecha con este método: la escena de la corbata, de 18 s.

## 7. Duraciones

| Referencia | Duración |
|---|---|
| Clip | 15 s |
| Vídeo negro del pangrama | 15 s |
| Audio del pangrama | 15 s |

Todas duran segundos enteros. Cada modelo de vídeo pone su propio límite y su propio precio a los vídeos de referencia: los comprueba quien haga el vídeo.

## 8. Lo que nunca se hace

- Adjuntar algo de `backup/`.
- Mezclar los modos: el clip junto a la 3x3, la hoja de 3 paneles o el vídeo de la voz.
- Reproducir el fondo gris, la cuadrícula, los paneles, la figura sin cabeza, la camiseta gris de la 3x3, la imagen negra o las palabras del pangrama.
- Pedir otra voz, otro acento o un timbre distinto para Luis.
- Cambiar el diálogo de una pista exacta o añadirle sonidos.
- Ponerle un objeto en la mano sin su hoja de escala.

## 9. Comprobación antes de lanzar

- [ ] El modo de referencias es el correcto para el outfit, y no se mezcla con el otro.
- [ ] Cada referencia citada es el archivo que toca, en el orden real de subida.
- [ ] De cada referencia se dice lo que se usa y lo que no.
- [ ] Los rasgos que se desvían están escritos.
- [ ] La voz sale de la referencia: guía de voz (método 1) o pista exacta (método 2), nunca una voz nueva.
- [ ] Con pista exacta, los tramos del prompt coinciden con su mapa de tiempos.

## 10. Historial

| Fecha | Cambio |
|---|---|
| 2026-11-18 | Hoja 3x3, hoja de 3 paneles del outfit 1 (v2), voz del pangrama natural, vídeo negro y clip de referencia aprobados |
| 2026-11-19 | Carpeta ordenada y guía de uso creada |
| 2026-11-19 | Guía sin prompting de ningún modelo, con los dos métodos de voz. El WAV final del pangrama pasa a `hojas-y-voz/Audio1_voz-pangrama_15s.wav` y el registro se llama `backup/registro.md` |

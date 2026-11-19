---
type: guia-uso-personaje
personaje: {{Nombre}}
actualizado: {{AAAA-MM-DD}}
estado: {{borrador | aprobado}}
creado_con: skill personaje-consistente v0.6
---

# {{Nombre}}

**Lee este archivo entero antes de escribir o revisar un prompt con {{Nombre}}.** Está escrito para quien prepare la escena: un agente que escribe prompts de vídeo, una skill que revisa o refina prompts, o una persona. Dice quién es {{Nombre}}, qué referencias tiene, qué aporta cada una y qué no se hereda de ella.

Este archivo **no es un prompt** ni está pensado para un modelo concreto. Para el **papel de cada referencia** de {{Nombre}}, manda este archivo. Para todo lo demás (escena, cámara, tiempos, sonido y forma de escribir el prompt) mandan las normas del modelo de vídeo que se use.

## 1. Qué hay en esta carpeta

```text
{{Nombre}}/
├── LEEME.md                                    este archivo
├── Video1_clip-{{outfit}}.mp4                  clip de referencia (modo B), uno por outfit con clip
├── Escala_{{objeto}}.png                       una por objeto: se usa en los dos modos
├── hojas-y-voz/
│   ├── Image1_cara-3x3.png
│   ├── Image2_{{outfit}}_3paneles.png          una por outfit
│   ├── Video1_voz-pangrama_{{T}}s.mp4          vídeo negro con la voz (método 1)
│   └── Audio1_voz-pangrama_{{T}}s.wav          la misma voz en audio, para clonarla en Seed Audio (método 2)
└── backup/                                     NO se adjunta nunca
    ├── fuentes/      fotos de partida, hoja de producto y voz original
    ├── prompts/      prompts con los que se generó cada pieza
    ├── descartes/    versiones rechazadas
    └── registro.md   generaciones, costes, medidas de la voz y decisiones
```

{{Se borran del árbol las líneas que no existan: sin clip no hay `Video1_clip`, sin objetos no hay `Escala_`.}}

- **`backup/`** es historial: nada de ahí va a ningún modelo.
- El prefijo de cada archivo (`Image1`, `Image2`, `Video1`, `Audio1`) es su número si solo se sube eso. Si la escena lleva más materiales, el número real es el que toque por orden de subida.

Abre y mira cada imagen o vídeo antes de escribir: lo que el prompt diga de una referencia tiene que coincidir con lo que muestra.

## 2. Quién es {{Nombre}}

| Dato | Valor |
|---|---|
| Nombre en el prompt | {{Nombre}} |
| Pronombres en inglés | {{he / his}} |
| Edad aparente | {{EDAD}} |
| Altura y complexión | {{ALTURA}} cm, {{COMPLEXION}} |
| Cara | {{Pelo, ojos (con el color del iris), cejas, nariz, labios, vello facial, maquillaje}} |
| Marcas | {{Lunares, pecas, cicatrices, piercings y tatuajes, situados respecto a un punto fijo. Marcas del cuerpo o "ninguna"}} |
| Rasgos que más se desvían | {{Los que se han ido al generar, con cómo se van}} |
| {{Outfit 1 (etiqueta)}} | {{Prendas de arriba abajo, cierres, herrajes, calzado y accesorios}} |
| Personalidad | {{2 o 3 adjetivos}} |
| Forma de actuar | {{Postura, forma de caminar, mano con la que gesticula, sonrisa, mirada a cámara, microvida. Lo no definido: (pendiente)}} |
| Voz | {{Edad, idioma y acento, tono}} |

{{Una fila por outfit. Si un objeto forma parte del personaje, una fila "Objetos" con su tamaño real en cm y cómo lo lleva.}}

**En inglés, para el prompt** (son datos del personaje, sirven para cualquier modelo):

- Rasgos que hay que nombrar siempre: {{RASGOS_DERIVA_EN}}.
- Marcas: {{MARCAS_EN}}.
- Outfit {{1}}: {{OUTFIT_EN}}.

## 3. Elegir el modo de referencias

| Situación | Modo |
|---|---|
| {{Nombre}} lleva **{{un outfit con clip}}** | **B · clip** |
| {{Nombre}} lleva **{{un outfit sin clip}}** | **A · hojas** |
| Se quiere comparar o el clip da problemas | **A · hojas** |

- Los dos modos **no se mezclan**. Con el clip no se adjuntan la 3x3, la hoja de 3 paneles ni el vídeo de la voz: el clip es la única fuente de {{Nombre}}, y dos fuentes de la misma cara que no coinciden del todo hacen que el modelo las mezcle. Lo que se desvía se refuerza por texto, con los rasgos de la sección 2.
- **Objetos:** en los dos modos, cada objeto que sostiene, lleva puesto o carga va con su `Escala_<objeto>.png`. Un objeto sin hoja de escala no se usa: hay que crearla antes.

### Si la escena lleva otro outfit

Es decisión de quien haga el vídeo. La recomendación: **si la escena lleva un outfit que no está en esta carpeta, mejor crear antes su hoja de 3 paneles**, para que el modelo vea las prendas en vez de imaginarlas.

## 4. Modo B · clip

{{Si no hay ningún clip: "No hay clip todavía. Se usa el modo A." y se borra el resto de esta sección.}}

| Referencia | Archivo | Qué aporta | Qué NO se hereda |
|---|---|---|---|
| Clip de {{Nombre}} | `Video1_clip-{{outfit}}.mp4` ({{T_CLIP}} s) | Cara, pelo, cuerpo, outfit, voz, forma de hablar y forma de emocionarse | Los dos paneles, el fondo gris, el encuadre, los cortes del montaje y las palabras del pangrama |
| Escala de cada objeto | `Escala_{{objeto}}.png` | Tamaño real del objeto contra su cuerpo | La pose, el fondo, el encuadre |

- El clip es la **única fuente** de cara, cuerpo, outfit y voz. El outfit no hace falta reescribirlo prenda a prenda: lo enseña el clip.
- La voz de {{Nombre}} es la del clip: mismo timbre, tono, textura, ritmo y acento. La emoción de cada frase cambia la energía y el ritmo, nunca la voz.
- {{Si el clip se hizo con el pangrama natural: "El clip se hizo con el pangrama natural y enseña poco rango emocional: si una frase lleva una emoción marcada (enfado, risa, sorpresa), conviene describir cómo se le nota en la cara y el cuerpo." Si se hizo con el emocional: "El clip se hizo con el pangrama emocional: enseña cómo se emociona {{Nombre}}."}}

## 5. Modo A · hojas

| Referencia | Archivo | Qué aporta | Qué NO se hereda |
|---|---|---|---|
| Hoja 3x3 | `hojas-y-voz/Image1_cara-3x3.png` | Cara, anatomía facial, pelo, tono de piel y cada marca de la piel | El fondo gris, la cuadrícula, {{la ropa que lleve en la 3x3}}, que haya nueve caras, las expresiones |
| Hoja de 3 paneles | `hojas-y-voz/Image2_{{outfit}}_3paneles.png` | Cuerpo, {{ALTURA}} cm, proporciones y el outfit prenda a prenda | El fondo gris, los tres paneles, las líneas de separación, el panel izquierdo sin cabeza (nunca se enseña a {{Nombre}} sin cabeza) |
| Escala de cada objeto | `Escala_{{objeto}}.png` | Tamaño real del objeto contra su cuerpo | La pose, el fondo, el encuadre |
| Voz (solo método 1) | `hojas-y-voz/Video1_voz-pangrama_{{T}}s.mp4` ({{T}} s) | Solo la voz: timbre, tono, textura, ritmo y acento | La imagen negra y las palabras del pangrama |

- Cada referencia se describe por separado, con lo que se usa de ella y lo que no.
- Con otro personaje en la escena, se deja claro que no se intercambian aspecto, ropa, acciones, posiciones ni diálogo.

## 6. La voz en la escena: dos métodos

### Método 1 · Pangrama en vídeo

- **Modo A:** se adjunta `hojas-y-voz/Video1_voz-pangrama_{{T}}s.mp4`. Es una **guía de voz, no una pista**: el modelo hereda la voz de {{Nombre}}, pero las palabras del pangrama nunca se dicen en la escena. El diálogo lo escribe el prompt.
- **Modo B:** la voz sale del clip. No se adjunta nada más.

### Método 2 · Seed Audio en vídeo

La pista sonora completa de la escena, hecha con Seed Audio a partir del prompt de vídeo y clonando la voz de {{Nombre}} con `hojas-y-voz/Audio1_voz-pangrama_{{T}}s.wav`. Llega como un vídeo negro `Pista_<escena>_<T>s.mp4`, en la carpeta de la escena. Con este método se usa el **modo A (hojas)**: el clip también lleva voz y serían dos fuentes de voz.

Contrato de la pista:

- Solo se usa su audio. La imagen negra se ignora.
- Es la **pista exacta**: manda sobre el diálogo, las voces, el acento, las pausas, el ambiente y el momento de cada sonido.
- No se regenera, reescribe, acorta, alarga ni sustituye ningún diálogo. No se crea ninguna voz nueva ni se añade ningún sonido.
- Labios, respiración, gestos, pasos y contactos con objetos se sincronizan con ella.
- Con la pista, el vídeo negro del pangrama no se adjunta: la voz ya va en ella.

La pista viene con su **mapa de tiempos** (qué suena en cada segundo). Los tramos del prompt de vídeo se cuadran con ese mapa, no con los tiempos que se pidieron al generar la pista.

## 7. Duraciones

| Referencia | Duración |
|---|---|
| Clip | {{T_CLIP}} s |
| Vídeo negro del pangrama | {{T}} s |
| Audio del pangrama | {{T}} s |

Todas duran segundos enteros. Cada modelo de vídeo pone su propio límite y su propio precio a los vídeos de referencia: los comprueba quien haga el vídeo.

## 8. Lo que nunca se hace

- Adjuntar algo de `backup/`.
- Mezclar los modos: el clip junto a la 3x3, la hoja de 3 paneles o el vídeo de la voz.
- Reproducir el fondo gris, la cuadrícula, los paneles, la figura sin cabeza, {{la ropa de la 3x3}}, la imagen negra o las palabras del pangrama.
- Pedir otra voz, otro acento o un timbre distinto para {{Nombre}}.
- Cambiar el diálogo de una pista exacta o añadirle sonidos.
- Usar un objeto sin su hoja de escala.

## 9. Comprobación antes de lanzar

- [ ] El modo de referencias es el correcto para el outfit, y no se mezcla con el otro.
- [ ] Cada referencia citada es el archivo que toca, en el orden real de subida.
- [ ] De cada referencia se dice lo que se usa y lo que no.
- [ ] Los rasgos que se desvían están escritos.
- [ ] La voz sale de la referencia: guía de voz (método 1) o pista exacta (método 2), nunca una voz nueva.
- [ ] Con pista exacta, los tramos del prompt coinciden con su mapa de tiempos.
- [ ] Cada objeto tiene su hoja de escala.

## 10. Historial

| Fecha | Cambio |
|---|---|
| {{AAAA-MM-DD}} | {{Qué se creó o cambió}} |

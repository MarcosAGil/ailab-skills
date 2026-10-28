# Casos de prueba de la skill

Cada caso es un defecto real. Sirven para comprobar que la skill y el lint los detectan **antes** de tocar nada, y que no vuelven a aparecer. Cuando cambies la skill, repasa esta lista.

## Cómo se ejecutan

```bash
python3 scripts/lint_prompt.py evals/prompt-ponencia-mando.txt --duration 17 --audio evals/audio-17s.json
python3 scripts/lint_prompt.py evals/prompt-ponencia-corregido.txt --duration 17 --audio evals/audio-17s.json
```

- `prompt-ponencia-mando.txt` es un prompt con defectos reales: el lint debe dar **4 errores** (huecos de plantilla, límite de tramo sobre una palabra, frase que cruza el límite y final imposible) y avisos de manos, priming, bokeh y delivery.
- `prompt-ponencia-corregido.txt` es la versión corregida: debe dar **0 errores** (como mucho avisos de longitud y de doble micrófono, que piden confirmar con la imagen).
- `audio-17s.json` es la medición del audio de 17 s (silencios, palabras y cola de silencio).

## Casos

| Caso | Entrada | Resultado esperado |
|---|---|---|
| C01 | Hueco de plantilla (`[Location]`) | Error del lint |
| C02 | Límite de tramo dentro de una palabra del audio | Error del lint con la palabra |
| C03 | Frase que suena fuera de su tramo | Error del lint con tiempos |
| C04 | Final con "holds still" o "echo tail" y audio pegado al final | Error del lint |
| C05 | Mano que sostiene un objeto con gestos de mano abierta | Aviso del lint; la skill adapta a antebrazo y muñeca |
| C06 | "lifts the phone", "opens the zoom" | Error del lint |
| C07 | "nobody holds anything up" | Aviso del lint |
| C08 | "no bokeh" con primer plano desenfocado | Aviso del lint |
| C09 | "quieter" o "louder" con audio exacto | Aviso del lint |
| C10 | Micrófono de mano y de diadema a la vez | Aviso del lint; la skill pregunta |
| C11 | Zoom en movimiento pedido por el usuario | La skill avisa del riesgo y propone encuadre abierto o corte duro |
| C12 | Texto hablado sin plan de movimiento (un gesto por frase) | La skill construye el plan y no repite gestos |
| C13 | Pausa descrita con la duración del guion y no la medida | La skill usa la medición |
| C14 | Prompt que se entrega sin pasar el lint (cuando hay Python) | La skill ejecuta el lint y corrige hasta 0 errores |

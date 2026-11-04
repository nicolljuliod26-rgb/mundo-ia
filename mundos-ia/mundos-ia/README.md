# mundos-ia

Programa de consola para un estudio de videojuegos: recibe una **situación**, un **mundo** y **5 colores**, y genera un boceto visual del mundo imaginario.

```
[Terminal: situación, mundo y 5 colores]
        │  process.argv
        ▼
data/mundo_<id>.json              (objeto JSON)
        │  se lee el JSON guardado
        ▼
API de TEXTO  (fetch)  ───►  descripciones/mundo_<id>.txt
        │  se envía la descripción
        ▼
API de IMAGEN (fetch)  ───►  imagenes/mundo_<id>.jpg
```

## Configuración

1. Instala Node.js 20.12 o superior (`node -v`) y ejecuta `npm install`.
2. Copia `.env.example` a `.env` y escribe tus claves:

   ```
   cp .env.example .env
   ```

   | Variable | Qué es |
   |---|---|
   | `TEXTO_API_KEY` | Clave del servicio de texto |
   | `TEXTO_URL` | URL del servicio de texto |
   | `TEXTO_MODELO` | Nombre del modelo de texto |
   | `IMAGEN_API_KEY` | Clave del servicio de imágenes |
   | `IMAGEN_URL` | URL completa del servicio de imágenes |

3. **Nunca** subas el `.env` a Git ni pegues tus claves en chats o capturas.

## Uso

Las comillas son necesarias en la situación y el mundo, y el doble guion `--` es necesario después de `npm start`:

```
npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta
```

Salida esperada:

```
Paso 1: mundo guardado en data/mundo_<id>.json
Paso 2: descripción guardada en descripciones/mundo_<id>.txt
Paso 3: imagen guardada en imagenes/mundo_<id>.jpg
Listo. Revisa la carpeta imagenes/
```

Si repites el mismo comando, no se llama a ninguna API (se reutilizan los archivos) y se ahorra cuota gratuita. Si un paso falla, los archivos de los pasos anteriores se conservan y al ejecutar otra vez el programa continúa donde quedó.

## Estructura de carpetas

```
mundos-ia/
├── src/
│   ├── index.js     # orquesta los pasos 1 a 3
│   ├── mundo.js     # valida los argumentos, crea el objeto y lo guarda o lee (JSON)
│   ├── texto.js     # consulta al modelo de lenguaje (fetch)
│   └── imagen.js    # consulta al modelo de imágenes (fetch) y devuelve los bytes
├── evidencias/      # capturas de pantalla
├── .env             # tus claves (NO va a Git)
├── .env.example
├── .gitignore
├── package.json
├── PROMPT.md
└── README.md
```

Las carpetas `data/`, `descripciones/` e `imagenes/` se crean solas al ejecutar el programa y no se suben a Git.

## Servicios elegidos

- **Texto:** [Groq](https://console.groq.com) con el modelo `openai/gpt-oss-20b` ([modelos](https://console.groq.com/docs/models), [límites](https://console.groq.com/docs/rate-limits)).
- **Imagen:** [NVIDIA · FLUX.1-schnell](https://build.nvidia.com/black-forest-labs/flux_1-schnell) ([referencia de la API](https://docs.api.nvidia.com/nim/reference/black-forest-labs-flux_1-schnell)).

Puedes cambiar de servicio solo editando el `.env` (texto: cualquier servicio compatible con OpenAI; imagen: el código reconoce NVIDIA, Cloudflare Workers AI y Pollinations por la URL).

## Experimento con `npm publish --dry-run`

**Con `.gitignore`** (6 archivos): solo se publicarían `.env.example`, `package.json` y los 4 archivos de `src/`. No aparece `.env`, `data/`, `descripciones/` ni `imagenes/`.

**Sin `.gitignore`** (renombrado a `.gitignore.off`, 11 archivos): aparecieron `.env`, `data/mundo_demo.json`, `descripciones/mundo_demo.txt` e `imagenes/mundo_demo.jpg`, además del propio `.gitignore.off`.

**Por qué es peligroso:** cuando no existe `.npmignore`, npm usa el `.gitignore` para decidir qué excluir. Sin él, el `.env` con las claves reales viajaría dentro del paquete publicado y quedaría público en npm, donde cualquiera podría descargarlo y usar (o gastar) tus claves. Una clave publicada se considera comprometida: hay que revocarla y crear otra. Después del experimento el archivo se restauró a `.gitignore`.

## Preguntas de reflexión

1. **¿Por qué el id se calcula sin la fecha?** Porque el id debe depender solo del contenido (situación, mundo y colores). Así, los mismos datos dan siempre el mismo id y el programa reconoce que ya existen `mundo_<id>.txt` y `mundo_<id>.jpg` para reutilizarlos. Si incluyera `creadoEn`, el id cambiaría en cada ejecución, nunca se reutilizarían los archivos y se gastaría cuota en cada corrida.

2. **¿Por qué la descripción en inglés?** Los modelos de imágenes se entrenan sobre todo con textos en inglés, por lo que interpretan mejor ese idioma y suelen producir imágenes más fieles a la descripción. *(Pendiente: probar con una descripción en español y comparar las imágenes.)*

3. **Respuesta JSON de texto vs. bytes de una imagen.** El JSON de texto es una cadena legible que se lee con `datos.choices[0].message.content`. Una imagen es un archivo binario (bytes) que no se puede representar directamente como texto. Por eso NVIDIA y Cloudflare la envían dentro del JSON en **base64**, una codificación que convierte bytes en caracteres de texto seguros. Hay que decodificarla con `Buffer.from(texto, 'base64')` para recuperar los bytes originales.

4. **¿Qué pasa si guardo la imagen con `'utf-8'`?** El archivo queda dañado. `'utf-8'` interpreta los datos como texto y reemplaza los bytes que no son caracteres válidos, así que se pierde información y el visor ya no puede abrir el archivo. Los bytes deben escribirse tal cual, sin codificación.

5. **¿Qué pasos consumen cuota y cómo evité repetirlos?** Consumen cuota el paso 2 (modelo de texto) y el paso 3 (modelo de imágenes). Se evita repetirlos con `fs.existsSync`: si `descripciones/mundo_<id>.txt` o `imagenes/mundo_<id>.jpg` ya existen, no se llama a la API. Además, el id estable hace que el mismo comando apunte siempre a los mismos archivos.

6. **Uso de IA:** *(Completa esta respuesta con tu experiencia personal; ver `PROMPT.md`.)*

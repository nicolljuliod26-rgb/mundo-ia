// texto.js: consulta al modelo de lenguaje (fetch) y guarda/lee la descripción (.txt)

const fs = require('fs');
const path = require('path');

const CARPETA_DESCRIPCIONES = path.join(__dirname, '..', 'descripciones');
const MAX_CARACTERES = 1500; // Cloudflare acepta máximo 2048

// Mensaje de sistema: le dice al modelo cómo debe responder
const MENSAJE_SISTEMA =
  'You are an art director who writes prompts for an image generation model. ' +
  'You will receive a JSON object with a situation, an imaginary world and five colors. ' +
  'Write ONE single paragraph in English, between 80 and 120 words, that describes a single image of that world. ' +
  'Describe the scene, the main elements, the lighting, the composition and the artistic style. ' +
  'It must be a visual description of an image, not a story or a narrative. ' +
  'Mention all five colors (translate them to English). ' +
  'Do not use titles, markdown, lists or quotation marks, and do not include any written text inside the image. ' +
  'Reply only with the paragraph.';

// Traduce un estado HTTP de error a un mensaje claro en español
function explicarEstado(respuesta) {
  const estado = respuesta.status;
  if (estado === 401 || estado === 403) {
    return 'La API key de texto no es válida. Revisa tu archivo .env.';
  }
  if (estado === 402 || estado === 429) {
    const espera = respuesta.headers.get('retry-after');
    const extra = espera ? ` El servicio sugiere esperar ${espera} segundos.` : '';
    return `Superaste el límite gratuito del modelo de texto. Espera un momento.${extra}`;
  }
  if (estado === 404 || estado === 410) {
    return 'El modelo de texto o la URL no existen. Revisa tu configuración (.env).';
  }
  return `El servicio de texto respondió con un error (HTTP ${estado}).`;
}

// Paso 2a: envía el JSON del mundo al modelo y devuelve la descripción
async function describirMundo(mundo) {
  const { TEXTO_API_KEY, TEXTO_URL, TEXTO_MODELO } = process.env;
  if (!TEXTO_API_KEY || !TEXTO_URL || !TEXTO_MODELO) {
    throw new Error('Faltan variables TEXTO_API_KEY, TEXTO_URL o TEXTO_MODELO en tu archivo .env.');
  }

  let respuesta;
  try {
    respuesta = await fetch(TEXTO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEXTO_API_KEY}`,
      },
      body: JSON.stringify({
        model: TEXTO_MODELO,
        messages: [
          { role: 'system', content: MENSAJE_SISTEMA },
          { role: 'user', content: JSON.stringify(mundo) },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('El servicio de texto tardó demasiado en responder.');
    }
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servicio de texto. Revisa tu internet o la URL.');
    }
    throw error;
  }

  if (!respuesta.ok) {
    throw new Error(explicarEstado(respuesta));
  }

  const datos = await respuesta.json();
  let descripcion = datos?.choices?.[0]?.message?.content;

  // Valida la respuesta: si llega vacía, lanza un Error
  if (typeof descripcion !== 'string' || descripcion.trim() === '') {
    throw new Error('El modelo de texto devolvió una respuesta vacía. Intenta de nuevo.');
  }
  descripcion = descripcion.trim();

  // Si es muy larga, se recorta y se avisa
  if (descripcion.length > MAX_CARACTERES) {
    descripcion = descripcion.slice(0, MAX_CARACTERES);
    console.log(`Aviso: la descripción superaba ${MAX_CARACTERES} caracteres y fue recortada.`);
  }

  return descripcion;
}

// Ruta del archivo de descripción de un mundo
function rutaDescripcion(id) {
  return path.join(CARPETA_DESCRIPCIONES, `mundo_${id}.txt`);
}

// Paso 2b: guarda la descripción en descripciones/mundo_<id>.txt
function guardarDescripcion(id, descripcion) {
  fs.mkdirSync(CARPETA_DESCRIPCIONES, { recursive: true });
  const ruta = rutaDescripcion(id);
  fs.writeFileSync(ruta, descripcion, 'utf-8');
  return ruta;
}

// Lee la descripción guardada
function leerDescripcion(id) {
  return fs.readFileSync(rutaDescripcion(id), 'utf-8');
}

module.exports = { describirMundo, rutaDescripcion, guardarDescripcion, leerDescripcion };

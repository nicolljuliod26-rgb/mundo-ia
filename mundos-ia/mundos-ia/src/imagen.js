// imagen.js: consulta al modelo de imágenes (fetch) y devuelve los bytes de la imagen

const fs = require('fs');
const path = require('path');

const CARPETA_IMAGENES = path.join(__dirname, '..', 'imagenes');

// Traduce un estado HTTP de error a un mensaje claro en español
function explicarEstado(respuesta) {
  const estado = respuesta.status;
  if (estado === 401 || estado === 403) {
    return 'La API key de imágenes no es válida o no tiene permisos. Revisa tu archivo .env.';
  }
  if (estado === 402 || estado === 429) {
    const espera = respuesta.headers.get('retry-after');
    const extra = espera ? ` El servicio sugiere esperar ${espera} segundos.` : '';
    return `Superaste el límite gratuito del modelo de imágenes. Espera un momento.${extra}`;
  }
  if (estado === 404 || estado === 410) {
    return 'El modelo de imágenes o la URL no existen. Revisa tu configuración (.env).';
  }
  return `El servicio de imágenes respondió con un error (HTTP ${estado}).`;
}

// Paso 3a: envía la descripción al servicio de imágenes y devuelve un Buffer con los bytes
async function generarImagen(descripcion) {
  const { IMAGEN_API_KEY, IMAGEN_URL } = process.env;
  if (!IMAGEN_URL) {
    throw new Error('Falta la variable IMAGEN_URL en tu archivo .env.');
  }

  const esPollinations = IMAGEN_URL.includes('pollinations');
  const esNvidia = IMAGEN_URL.includes('nvidia');
  if (!esPollinations && !IMAGEN_API_KEY) {
    throw new Error('Falta la variable IMAGEN_API_KEY en tu archivo .env.');
  }

  // Se arma la petición según el servicio
  let url = IMAGEN_URL;
  let opciones;
  if (esPollinations) {
    // Pollinations: GET sin clave; la descripción va dentro de la URL
    url = `${IMAGEN_URL}${encodeURIComponent(descripcion)}?width=1024&height=1024&nologo=true`;
    opciones = { method: 'GET', signal: AbortSignal.timeout(120000) };
  } else if (esNvidia) {
    opciones = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${IMAGEN_API_KEY}`,
      },
      body: JSON.stringify({ prompt: descripcion, width: 1024, height: 1024, steps: 4, seed: 0 }),
      signal: AbortSignal.timeout(60000),
    };
  } else {
    // Cloudflare Workers AI
    opciones = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${IMAGEN_API_KEY}`,
      },
      body: JSON.stringify({ prompt: descripcion, steps: 4 }),
      signal: AbortSignal.timeout(60000),
    };
  }

  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('El servicio de imágenes tardó demasiado en responder.');
    }
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servicio de imágenes. Revisa tu internet o la URL.');
    }
    throw error;
  }

  if (!respuesta.ok) {
    throw new Error(explicarEstado(respuesta));
  }

  let bytes;
  if (esPollinations) {
    // Llegan los bytes directamente
    bytes = Buffer.from(await respuesta.arrayBuffer());
  } else {
    // Llega un JSON con la imagen en base64
    const datos = await respuesta.json();
    let textoBase64;
    if (esNvidia) {
      const artefacto = datos?.artifacts?.[0];
      if (!artefacto || artefacto.finishReason !== 'SUCCESS') {
        throw new Error('El modelo de imágenes no pudo generar la imagen (finishReason distinto de SUCCESS).');
      }
      textoBase64 = artefacto.base64;
    } else {
      textoBase64 = datos?.result?.image;
    }
    if (typeof textoBase64 !== 'string' || textoBase64 === '') {
      throw new Error('La respuesta del servicio de imágenes no trae la imagen esperada.');
    }
    // base64 -> bytes (sin 'utf-8')
    bytes = Buffer.from(textoBase64, 'base64');
  }

  if (bytes.length === 0) {
    throw new Error('El servicio de imágenes devolvió una imagen vacía.');
  }
  return bytes;
}

// Ruta del archivo de imagen de un mundo
function rutaImagen(id) {
  return path.join(CARPETA_IMAGENES, `mundo_${id}.jpg`);
}

// Paso 3b: guarda los bytes tal cual en imagenes/mundo_<id>.jpg
function guardarImagen(id, bytes) {
  fs.mkdirSync(CARPETA_IMAGENES, { recursive: true });
  const ruta = rutaImagen(id);
  fs.writeFileSync(ruta, bytes); // sin 'utf-8': son bytes, no texto
  return ruta;
}

module.exports = { generarImagen, rutaImagen, guardarImagen };

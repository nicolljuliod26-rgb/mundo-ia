// mundo.js: valida los argumentos, crea el objeto del mundo y lo guarda o lee (JSON)
// Sistema de módulos: CommonJS (require / module.exports) en todo el proyecto.

const fs = require('fs');
const path = require('path');
const hash = require('object-hash');

// Rutas construidas desde la ubicación de este archivo, no desde donde se ejecuta
const CARPETA_DATA = path.join(__dirname, '..', 'data');

const USO =
  'Uso: npm start -- "<situación>" "<mundo>" <color1> <color2> <color3> <color4> <color5>\n' +
  'Ejemplo: npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" ' +
  '"Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta';

// Paso 1a: valida los argumentos y devuelve el objeto del mundo.
// Si algo falla, lanza un Error con un mensaje claro en español (sin datos técnicos).
function crearMundo(args) {
  // Validación 1: exactamente 7 argumentos
  if (args.length !== 7) {
    throw new Error(
      `Se esperaban 7 argumentos y llegaron ${args.length}. ` +
        'Recuerda poner entre comillas la situación y el mundo.\n' + USO
    );
  }

  // Validación 2: ningún argumento vacío o con solo espacios
  for (const arg of args) {
    if (arg.trim() === '') {
      throw new Error('Ningún argumento puede estar vacío ni tener solo espacios.\n' + USO);
    }
  }

  const situacion = args[0].trim();
  const mundo = args[1].trim();
  const colores = args.slice(2).map((color) => color.trim());

  // Validación 3: los 5 colores deben ser distintos (sin distinguir mayúsculas)
  const coloresEnMinuscula = colores.map((color) => color.toLowerCase());
  for (let i = 0; i < coloresEnMinuscula.length; i++) {
    if (coloresEnMinuscula.indexOf(coloresEnMinuscula[i]) !== i) {
      throw new Error('Los 5 colores deben ser distintos entre sí.\n' + USO);
    }
  }

  // El id son los 8 primeros caracteres del hash de { situacion, mundo, colores }.
  // creadoEn NO entra en el hash: así los mismos datos siempre dan el mismo id.
  const id = hash({ situacion, mundo, colores }).slice(0, 8);

  return {
    id,
    situacion,
    mundo,
    colores,
    creadoEn: new Date().toISOString(),
  };
}

// Paso 1b: guarda el objeto en data/mundo_<id>.json y devuelve la ruta
function guardarMundo(mundo) {
  fs.mkdirSync(CARPETA_DATA, { recursive: true });
  const ruta = path.join(CARPETA_DATA, `mundo_${mundo.id}.json`);
  // Si el mundo ya existía, se conserva el archivo original (y su fecha creadoEn)
  if (!fs.existsSync(ruta)) {
    fs.writeFileSync(ruta, JSON.stringify(mundo, null, 2), 'utf-8');
  }
  return ruta;
}

// Paso 1c: lee el JSON guardado y lo convierte en objeto
function leerMundo(ruta) {
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
}

module.exports = { crearMundo, guardarMundo, leerMundo };

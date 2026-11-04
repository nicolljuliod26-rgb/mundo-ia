// index.js: orquesta los pasos 1 a 3
// Uso: npm start -- "<situación>" "<mundo>" <color1> <color2> <color3> <color4> <color5>

const fs = require('fs');
const path = require('path');
const { crearMundo, guardarMundo, leerMundo } = require('./mundo');
const { describirMundo, rutaDescripcion, guardarDescripcion, leerDescripcion } = require('./texto');
const { generarImagen, rutaImagen, guardarImagen } = require('./imagen');

// Muestra una ruta relativa a la carpeta del proyecto (más legible en consola)
function relativa(ruta) {
  return path.relative(path.join(__dirname, '..'), ruta).split(path.sep).join('/');
}

async function main() {
  try {
    // Carga las claves desde .env (si el archivo existe)
    const rutaEnv = path.join(__dirname, '..', '.env');
    if (fs.existsSync(rutaEnv)) {
      process.loadEnvFile(rutaEnv);
    }

    // Paso 1: validar argumentos, crear el objeto y guardarlo en data/
    const mundoNuevo = crearMundo(process.argv.slice(2));
    const rutaJson = guardarMundo(mundoNuevo);
    console.log(`Paso 1: mundo guardado en ${relativa(rutaJson)}`);

    // Se vuelve a leer el JSON desde el archivo (se consulta lo guardado, no la memoria)
    const mundo = leerMundo(rutaJson);

    // Paso 2: descripción con el modelo de texto (solo si el .txt no existe)
    if (fs.existsSync(rutaDescripcion(mundo.id))) {
      console.log('Paso 2: la descripción ya existía, no se llamó al modelo de texto.');
    } else {
      const descripcionNueva = await describirMundo(mundo);
      const rutaTxt = guardarDescripcion(mundo.id, descripcionNueva);
      console.log(`Paso 2: descripción guardada en ${relativa(rutaTxt)}`);
    }

    // Paso 3: imagen con el modelo de imágenes (solo si el .jpg no existe)
    if (fs.existsSync(rutaImagen(mundo.id))) {
      console.log('Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.');
    } else {
      // La descripción que se envía se lee del archivo .txt guardado
      const descripcion = leerDescripcion(mundo.id);
      const bytes = await generarImagen(descripcion);
      const rutaJpg = guardarImagen(mundo.id, bytes);
      console.log(`Paso 3: imagen guardada en ${relativa(rutaJpg)}`);
    }

    console.log('Listo. Revisa la carpeta imagenes/');
  } catch (error) {
    // Mensaje claro en español; nunca se imprime la clave ni el error técnico completo
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();

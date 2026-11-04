# PROMPT.md — Cómo construí el programa

> Las secciones marcadas con **(COMPLETAR)** debes escribirlas tú con tu propia experiencia. No las inventes: en la sustentación te preguntarán por ellas.

## A. Declaración

**Usé IA: sí.**

## B. Herramienta y modelo

Claude (Anthropic), modelo Claude Sonnet 5.5, en la aplicación web/móvil de Claude.

## C. Prompt inicial completo (literal)

Adjunté el texto completo del taller (situación, resultado esperado, reglas, guía de servicios, Partes 1 a 8, entregables y rúbrica) y escribí:

> Puedes realizar esto tal cual como esta ahí por favor

## D. Prompts siguientes **(COMPLETAR)**

Anota al menos los 3 más importantes: qué pediste, qué respondió la IA y qué hiciste con esa respuesta.

| # | Mi prompt | Qué respondió la IA | Qué hice yo |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## E. Cambios que hice yo sobre lo que entregó la IA **(COMPLETAR)**

Mínimo 3, con el motivo. Ideas de cosas para revisar y ajustar: el autor en `package.json`, el mensaje de sistema de `texto.js`, los servicios elegidos en `.env`, los comentarios, los textos de error.

1.
2.
3.

## F. Una línea de código que no entendía al principio **(COMPLETAR)**

Elige una y explícala con tus palabras. Candidatas del proyecto:

- `const id = hash({ situacion, mundo, colores }).slice(0, 8);`
- `const bytes = Buffer.from(textoBase64, 'base64');`
- `signal: AbortSignal.timeout(60000)`
- `datos?.choices?.[0]?.message?.content`

Mi explicación:

## G. Un error y cómo lo resolví **(COMPLETAR)**

Ejemplo real que apareció al probar el programa en un entorno sin acceso a internet de la API:

```
Error: No se pudo conectar con el servicio de texto. Revisa tu internet o la URL.
```

El programa lo captura (`fetch` lanza `TypeError`) y termina con `process.exitCode = 1`, conservando el JSON del paso 1. Reemplaza o amplía esta sección con un error que hayas tenido tú: mensaje y cómo lo resolviste.

---

*Regla de oro: ninguna API key aparece en este archivo, en el código, en los commits ni en las capturas.*

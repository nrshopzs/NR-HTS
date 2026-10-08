# V127.48 — Textos editables

Esta versión añade un editor de contenido de texto al panel de administración de Niños Rancios.

## Qué se puede cambiar

- Navegación y etiquetas comunes.
- Textos estáticos de Inicio, Tienda, Nosotros, Contacto, políticas, Envíos, Cambios y devoluciones, Puntos de venta, Colaboraciones, Empleos, Promociones, Mi cuenta, Carrito, Checkout y páginas auxiliares.
- Títulos, botones, instrucciones, mensajes y etiquetas que coincidan con el texto registrado.
- Texto global para todo el sitio o reemplazos exclusivos de una página.

## Persistencia

`server/data/site-texts.json` forma parte de los archivos administrados por `server/admin-state.js`. En PostgreSQL se conserva dentro del espejo persistente `nr_admin_files`, por lo que el contenido no depende del disco efímero de Wasmer.

## Cómo funciona

El frontend solicita `/api/site-texts` y aplica las sustituciones de texto al cargar la página. Un `MutationObserver` también aplica los cambios a contenido que se agrega dinámicamente después de la carga.

El panel usa:

- `GET /api/admin/site-texts`
- `PATCH /api/admin/site-texts`

El endpoint público es:

- `GET /api/site-texts`

Los reemplazos son de texto plano; no aceptan HTML ejecutable.

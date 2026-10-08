# Niños Rancios V127.44 — Wasmer Staging

Esta versión corrige exclusivamente el empaquetado para el constructor `node-base` de Wasmer.

## Por qué existe V127.44

V127.43 ya era detectada como `node-base`, pero el ZIP tenía una carpeta contenedora. Durante la fase de instalación, Wasmer ejecutaba `npm install` desde `/opt/build` y no encontraba `/opt/build/package.json`.

V127.44 conserva el mismo proyecto, pero el ZIP final tiene `package.json` directamente en su raíz.

## Primera prueba

- Comando de inicio: `npm start`
- Comando de instalación: `npm install`
- Comando de construcción: vacío
- `NODE_ENV=production`
- `DATA_BACKEND=json`
- Base de datos desactivada

## Segunda prueba

Una vez confirmado el arranque, habilitar PostgreSQL en Wasmer y usar:

- `DATA_BACKEND=postgres`
- `NODE_ENV=production`

La capa de base de datos acepta las variables que Wasmer proporciona: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME` y `DB_PASSWORD`.

## Secretos

No subir un `.env` con claves reales. Introducir Brevo y demás credenciales en el panel de variables de entorno del proveedor.

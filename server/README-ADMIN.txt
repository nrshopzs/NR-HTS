ACTUALIZACIÓN V127.42 — POSTGRESQL
----------------------------------
Este archivo conserva instrucciones históricas de versiones anteriores.
Desde V127.42, si DATA_BACKEND=postgres, pedidos/inventario/clientes/sesiones/borradores de pago/usos de promociones se guardan en PostgreSQL y los JSON correspondientes quedan solo como respaldo de migración.
Consulta ../V127.42-LEEME.txt y ../POSTGRESQL-MIGRACION-V127.42.md antes de desplegar.

NIÑOS RANCIOS — PANEL DE ADMINISTRACIÓN V57

1. Copia tu .env de la versión anterior a server/.env.
2. Agrega una línea privada:
   ADMIN_PASSWORD=TU_CONTRASENA_SEGURA
3. No compartas el archivo .env.
4. Ejecuta dentro de server:
   npm install
   npm start
5. Abre:
   http://localhost:4242/admin.html

La V57 permite:
- ver resumen de pedidos y ventas;
- listar pedidos;
- cambiar estado: Pagado, Preparando, Enviado, Entregado;
- revisar y modificar inventario por producto/color/talla;
- ver el catálogo actual desde el panel;
- cerrar sesión.

IMPORTANTE:
- El acceso de API está protegido por una cookie de sesión HttpOnly.
- Esta autenticación es suficiente para pruebas locales, pero antes de publicar se debe endurecer seguridad, usar HTTPS y almacenamiento de sesiones persistente.
- Si quieres conservar pedidos de una versión local anterior, copia también server/data/orders.json y, si corresponde, server/data/inventory.json antes de arrancar V57.


V59 - RUTA PRIVADA
------------------
Agrega también en server/.env:

ADMIN_PATH=/una-ruta-larga-y-dificil-de-adivinar

Ejemplo:
ADMIN_PATH=/gestion-nr-9f3k2m8q

El panel se abrirá en:
http://localhost:4242/gestion-nr-9f3k2m8q

Las rutas /admin, /admin/ y /admin.html responden 404.
El panel sigue protegido por contraseña y sesión.
El servidor limita intentos fallidos de acceso.


V60 - PRODUCTOS EDITABLES
------------------------
Desde Productos puedes cambiar nombre, precio, descripción, categoría, colores y tallas.
Los cambios se guardan en server/data/products.json.
El inventario sigue en server/data/inventory.json.
Las combinaciones nuevas de color/talla empiezan en 0 unidades.
La carga/reemplazo de imágenes se agregará en el siguiente módulo.

Al migrar desde V59, conserva products.json de V60. Copia desde tu instalación anterior únicamente:
- server/.env
- server/data/orders.json
- server/data/inventory.json
- server/data/payment-drafts.json

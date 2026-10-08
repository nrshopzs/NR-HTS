# Persistencia del Panel — V127.47

Esta versión evita que la personalización administrativa vuelva a los valores del repositorio cuando Wasmer reinicia o reemplaza una instancia.

## Cómo funciona

Los módulos existentes siguen trabajando con sus archivos JSON y carpetas de uploads para no romper la tienda. V127.47 agrega una capa de persistencia que replica esos archivos a PostgreSQL en las tablas `nr_admin_files` y `nr_admin_file_chunks`.

En el arranque:

1. Se inicializa PostgreSQL.
2. Se restauran configuraciones y uploads persistidos.
3. Se inicia el servidor HTTP.

Después de cada operación de escritura exitosa del panel `/api/admin`, se ejecuta una sincronización. Los archivos de hasta 8 MB se guardan en una fila; los mayores se dividen en bloques de 4 MB.

## Prueba recomendada

1. Desplegar V127.47 con `DATA_BACKEND=postgres`.
2. Entrar al panel y cambiar un texto visible de la portada.
3. Guardar.
4. Revisar Logs y confirmar `Persistencia del panel OK`.
5. Hacer un nuevo commit inocuo en GitHub para provocar un redeploy.
6. Confirmar que el texto personalizado continúa igual después del nuevo deployment.

## Seguridad

No se persiste `.env` ni claves de entorno dentro de `nr_admin_files`. Las credenciales de PostgreSQL, Brevo, Stripe, PayPal y la contraseña del panel deben seguir configurándose como variables de entorno de Wasmer.

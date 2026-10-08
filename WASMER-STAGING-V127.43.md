# V127.43 · Wasmer Edge / Staging

## Motivo de esta versión

V127.42 fue detectada por el cargador web de Wasmer como `staticfile` porque `index.html` estaba en la raíz. Al seleccionar manualmente `Other`, el builder usado por Wasmer no incluía `npm`, por lo que `cd server && npm install` terminaba con `npm: command not found` (exit code 127).

V127.43 cambia únicamente el empaquetado necesario para que la raíz represente una aplicación Node/Express: `package.json` y `server.js` están en la raíz y los recursos web están bajo `public/`.

## Primera prueba recomendada

1. Crear un proyecto/app nuevo en Wasmer o volver al formulario de carga.
2. Subir el ZIP completo de V127.43.
3. Confirmar que Wasmer ya no propone `staticfile`.
4. No elegir manualmente `Other` con comandos `npm`.
5. Para el primer arranque puede usarse `DATA_BACKEND=json` solo como smoke test.
6. Mantener `NODE_ENV=production` y configurar las variables privadas únicamente en Wasmer.
7. Habilitar PostgreSQL cuando vayamos a probar la persistencia real.

## PostgreSQL en Wasmer

Wasmer expone la base administrada mediante estas variables de entorno:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`

V127.43 las acepta directamente. No es necesario construir ni mostrar una `DATABASE_URL` si Wasmer ya inyectó esas cinco variables.

Para activar PostgreSQL:

```env
DATA_BACKEND=postgres
DATABASE_SSL=false
DATABASE_POOL_MAX=10
```

No escribas los valores `DB_*` dentro del ZIP: los debe inyectar Wasmer.

## Migración

El comando sigue disponible desde la raíz:

```bash
npm run db:migrate
npm run db:check
npm run security:check
```

No ejecutar la migración dos veces sobre una base con datos salvo que se haya realizado un respaldo y se entienda el uso de `--force`.

## Limitación de Wasmer para esta fase

Las instancias de Wasmer Edge son efímeras. V127.42 solo migró a PostgreSQL los datos críticos de pedidos, inventario, clientes, sesiones, borradores de pago y uso de promociones. Otros archivos configurables y las cargas de imágenes/videos continúan en archivos locales. Por eso Wasmer se usa temporalmente como staging para validar Node/Express y PostgreSQL, no como alojamiento definitivo de producción en esta fase.

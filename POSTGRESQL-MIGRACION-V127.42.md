# PostgreSQL / migración JSON — V127.42

V127.42 agrega una capa de persistencia que permite usar PostgreSQL como fuente de verdad para pedidos, inventario, clientes, sesiones de cliente, borradores de pago y usos de promociones. El modo JSON de V127.41 se conserva para desarrollo local y recuperación.

## Modos de persistencia

```env
DATA_BACKEND=auto
DATABASE_URL=
DATABASE_SSL=false
DATABASE_POOL_MAX=10
```

- `DATA_BACKEND=auto`: usa PostgreSQL si existe `DATABASE_URL`; de lo contrario usa JSON.
- `DATA_BACKEND=json`: fuerza compatibilidad JSON.
- `DATA_BACKEND=postgres`: exige `DATABASE_URL` y falla al iniciar si falta.

`DATABASE_SSL=true` habilita TLS con verificación de certificado. `DATABASE_SSL=no-verify` existe solo para proveedores que documenten expresamente esa necesidad; no debe usarse por defecto.

## Tablas

- `nr_orders`: conserva el payload completo del pedido en JSONB y columnas indexadas para búsquedas, estados y proveedores de pago.
- `nr_inventory`: una fila por variante `product_id + color + size`.
- `nr_customers`: payload JSONB con correo indexado de forma única.
- `nr_customer_sessions`: hashes de token y vencimientos.
- `nr_payment_drafts`: borradores de checkout/pago por clave.
- `nr_promotion_usage`: registro de uso de promociones.

Los identificadores de Stripe, PayPal y Mercado Pago tienen índices `UNIQUE` parciales para que dos instancias no puedan crear dos pedidos con el mismo pago confirmado.

## Primera migración

La base de datos de destino debe estar vacía.

```bash
cd server
npm install
npm run db:migrate
npm run db:check
npm run security:check
npm start
```

`db:migrate` crea el esquema si hace falta, importa los JSON y compara el número de registros/variantes antes de confirmar la transacción. Si detecta datos existentes, se detiene para evitar sobrescrituras accidentales.

### Reimportación deliberada

Solo después de tener un respaldo:

```bash
npm run db:migrate -- --force
```

`--force` vacía las seis tablas V127.42 y vuelve a importar desde los JSON locales.

## Qué pasa con los JSON

La migración **no los elimina ni los modifica**. Una vez activado PostgreSQL, la aplicación deja de usarlos como fuente de verdad para las seis áreas migradas, pero conviene conservarlos como respaldo durante las pruebas de V127.42.

## Transacciones

En modo PostgreSQL, los flujos que combinan pedido e inventario se ejecutan dentro de una transacción. Los bloqueos siguen un orden consistente: primero pedidos, después inventario. Si una inserción viola una restricción única o cualquier paso falla, PostgreSQL revierte la operación completa.

Esto mejora específicamente los casos de:

- dos webhooks/finalizaciones simultáneos del mismo pago;
- dos compras intentando consumir la misma variante;
- cancelación/expiración mientras otra operación modifica el pedido;
- creación de pedido manual y reserva de inventario.

## Railway

Para el despliegue previsto, crear un servicio PostgreSQL dentro del mismo proyecto Railway y conectar `DATABASE_URL` mediante variables de entorno. Usar `DATA_BACKEND=postgres` en staging/producción para evitar que una variable ausente haga que la aplicación vuelva silenciosamente a JSON.

Antes de decidir `DATABASE_SSL` y `TRUST_PROXY_HOPS`, confirmar la topología real del servicio Railway que se vaya a utilizar.

## Alcance deliberado

V127.42 no migra todavía `products.json`, `promotions.json`, `customer-action-tokens.json` ni configuraciones visuales/administrativas. Tampoco cambia el frontend. Es una migración incremental para no arriesgar funciones ya validadas.

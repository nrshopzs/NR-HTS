# Wasmer staging — V127.45

V127.45 reemplaza el uso del Cron Job como mecanismo principal de migración inicial.
La tarea de mantenimiento se ejecuta dentro del proceso de arranque de la app y usa
las credenciales PostgreSQL adjuntas por Wasmer, independientemente de
`DATA_BACKEND`.

## Comprobación segura

Mantener:

```env
DATA_BACKEND=json
NODE_ENV=production
POSTGRES_MAINTENANCE_ACTION=check
```

Redeploy. En Logs debe aparecer `PostgreSQL maintenance check OK` con los conteos.
La tienda continúa usando JSON.

## Migración

Cuando el check funcione:

```env
DATA_BACKEND=json
POSTGRES_MAINTENANCE_ACTION=migrate
POSTGRES_MIGRATION_FORCE=false
```

Redeploy. La migración crea/valida las tablas y copia:

- orders.json
- inventory.json
- customers.json
- customer-sessions.json
- payment-drafts.json
- promotion-usage.json

Todo ocurre dentro de una transacción. Si falla la validación, se hace rollback.
Los JSON no se borran.

## Después

Quitar `POSTGRES_MAINTENANCE_ACTION` (o dejarlo vacío), redeploy y validar la base.
Solo entonces cambiar `DATA_BACKEND=postgres` y repetir el checklist funcional.

`POSTGRES_MIGRATION_FORCE=true` vacía y reimporta las seis tablas. No usar durante
la migración normal ni sin respaldo explícito.

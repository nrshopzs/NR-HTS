# V127.49 — Actualización sin perder el diseño actual

Esta versión está construida para actualizar una instalación **V127.47** que ya fue personalizada desde el panel.

## Qué se conserva

La V127.47 ya guarda en PostgreSQL el estado administrativo, incluyendo `server/data/homepage.json` y los recursos administrados. La V127.49 mantiene ese mismo mecanismo.

Al iniciar la aplicación, el proceso de restauración hace lo siguiente:

1. Lee `nr_admin_files` desde PostgreSQL.
2. Restaura los archivos existentes a la nueva instancia.
3. Compara los archivos administrados incluidos en el paquete.
4. Solo agrega a PostgreSQL los archivos que todavía no existan.

Por eso, la configuración de portada y demás personalizaciones existentes **no se reemplazan con los valores del ZIP**.

## Qué se agrega

La V127.49 incorpora el editor **Textos del sitio**, basado en `server/data/site-texts.json`. Como ese archivo no existía en V127.47, se agrega como un archivo nuevo sin tocar los archivos previamente persistidos.

## Requisito indispensable

Actualiza la **misma app de Wasmer** y mantén la **misma base PostgreSQL**. Si creas una app nueva con una base nueva, no existirá el estado persistido que contiene tu diseño actual.

## Prueba recomendada

Después del despliegue:

1. Verifica que la portada conserve exactamente el diseño actual.
2. Entra a Administración > Textos del sitio.
3. Cambia un texto pequeño, por ejemplo `Nosotros` por `Nuestra historia`.
4. Guarda.
5. Haz un redeploy con un commit inocuo.
6. Comprueba que tanto el diseño como el texto personalizado sigan iguales.

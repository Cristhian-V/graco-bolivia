## 1. Base de datos y almacenamiento

- [x] 1.1 Agregar la tabla `manifiestos` (con `UNIQUE (num_man)` y `correlativo`) al esquema idempotente; verificar que el backend la aplica al arrancar y que `psql` la lee sin errores.
- [x] 1.2 Agregar el volumen `downloads` en `docker-compose.yml` (montado en el backend) y asegurar que la carpeta se crea; verificar con `docker compose config` y `docker compose up`.

## 2. Backend — scraper de manifiestos

- [x] 2.1 Implementar el cliente `criBus` (`count` + `getParteRecepcionByCriBus` con paginación por offset) reutilizando `login` y headers; verificar con un NIT real que el conteo y los resultados coinciden.
- [x] 2.2 Implementar `getManifiestoCarga` (detalle de manifiesto) y la lógica "Ver Manifiesto" (último `docFir.id`, si no `docSopMic` TR-007/BT); verificar que devuelve un id de PDF para un manifiesto real.
- [x] 2.3 Implementar la descarga del PDF (`reporte/visor/{id}`) y escritura en `downloads/{nit}/{nombre_cliente}_{correlativo}.pdf`; verificar que el archivo se guarda y es un PDF válido.

## 3. Backend — ingestión y programación

- [x] 3.1 Implementar el recorrido por cliente: `SELECT DISTINCT aduana_recepcion_cod FROM prm WHERE nit=$1` y la iteración por aduana; verificar que recupera las aduanas de un cliente con datos.
- [x] 3.2 Implementar el filtro por `fecTra` y la deduplicación por `numMan` (upsert en `manifiestos`, omitir existentes); verificar que re-ejecutar no re-descarga.
- [x] 3.3 Implementar el correlativo por cliente (`MAX(correlativo)+1`) y el sanitizado del nombre de archivo; verificar que dos manifiestos del mismo cliente obtienen 001 y 002.
- [x] 3.4 Encadenar la corrida de manifiestos después de la de PRMs en el scheduler del sábado; verificar que el orden de ejecución es PRMs → manifiestos.

## 4. Backend — API REST

- [x] 4.1 Exponer `GET /api/aduanas` y `POST /api/aduanas` (rechazando código duplicado); verificar listar y dar de alta una aduana.
- [x] 4.2 Exponer `GET /api/manifiestos?nit=` (listado de manifiestos por cliente); verificar que devuelve los campos incluyendo `nombre_archivo`.
- [x] 4.3 Exponer el acceso al PDF (servir el archivo o `GET /api/manifiestos/:id/archivo`); verificar que se descarga el PDF almacenado.
- [x] 4.4 Exponer `POST /api/ejecutar-manifiestos` para disparo manual/backfill; verificar que ejecuta una corrida de manifiestos.

## 5. Frontend React

- [x] 5.1 Reestructurar `App.jsx` con barra lateral de secciones y mover las vistas actuales a la sección "PRMs"; verificar que la navegación entre secciones funciona.
- [x] 5.2 Implementar la sección "Aduanas" (tabla + formulario de alta consumiendo `GET/POST /api/aduanas`); verificar que lista y crea aduanas.
- [x] 5.3 Implementar la sección "Manifiestos" (selector de cliente + tabla con enlace al PDF); verificar que lista y abre los PDFs.

## 6. Integración y validación

- [x] 6.1 Levantar todo con `docker compose up --build` y verificar el flujo completo (login → PRMs → manifiestos → PDF en `downloads/`) contra datos reales.
- [x] 6.2 Ejecutar la primera carga de manifiestos (julio en adelante) y verificar en la sección de Manifiestos que aparecen los PDFs sin duplicados.

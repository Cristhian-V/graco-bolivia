## Why

Hoy solo se extraen los PRMs; el equipo necesita además descargar el PDF del manifiesto (MIC/DTA) asociado a cada importación de cada cliente, y consultar estos archivos desde la interfaz web. También se requiere reorganizar el frontend en secciones y poder gestionar el catálogo de aduanas.

## What Changes

- Nueva extracción de manifiestos: para cada cliente se buscan sus aduanas de recepción desde la sección de PRMs, se consulta la sección "Agrupación de PRM's" de SUMA (búsqueda `criBus` por NIT del importador + aduana de recepción) y se descarga el PDF de cada manifiesto (acción "Ver Manifiesto").
- Deduplicación de manifiestos por número de manifiesto (`numMan`), de modo que solo se descarguen los nuevos.
- Almacenamiento de los PDFs en una carpeta del backend, con nombre de archivo `{nombre_cliente}_{correlativo_por_cliente}.pdf`.
- Programación semanal (sábado) que corre después de la corrida de PRMs.
- Frontend reorganizado en secciones con barra lateral: sección "PRMs" (lo existente), sección "Aduanas" (listar + dar de alta registros) y sección "Manifiestos" (listar y abrir los PDFs descargados).

## Capabilities

### New Capabilities
- `manifiestos`: descarga de manifiestos (PDF) por cliente vía la API de SUMA, con deduplicación por número de manifiesto, guardado en carpeta del backend y programación semanal.

### Modified Capabilities
- `prm-dashboard`: el frontend pasa a organizarse en secciones con barra lateral y agrega las secciones de Aduanas y de Manifiestos.
- `prm-ingestion`: se agrega el catálogo de aduanas con alta de nuevos registros vía API.

## Impact

- Backend: nuevos servicios de extracción de manifiestos (búsqueda `criBus`, detalle de manifiesto, descarga de PDF), nueva tabla `manifiestos`, carpeta `downloads/` montada como volumen, y endpoints `GET/POST /api/aduanas` y `GET /api/manifiestos`.
- Frontend: reestructuración de `App.jsx` con barra lateral y nuevas vistas.
- Programación: la corrida semanal encadena la de PRMs y luego la de manifiestos.
- Depende de la API de SUMA ya integrada (`n-ingreso`, `ssu-mim-ingreso-rest`, `reporte/visor`).

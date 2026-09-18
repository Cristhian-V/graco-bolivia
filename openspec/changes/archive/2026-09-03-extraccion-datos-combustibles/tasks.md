## 1. Base de datos y almacenamiento

- [x] 1.1 Agregar la tabla `combustibles` (con `UNIQUE (dim_dam)`) al esquema idempotente; verificar que el backend la aplica al arrancar y que `psql` la lee sin errores.
- [x] 1.2 Agregar el volumen `documentos-despacho` en `docker-compose.yml` (montado en el backend); verificar con `docker compose config` y `docker compose up`.

## 2. Spike: mapeo de la API de DIM/DAM

- [x] 2.1 Hacer un spike con un manifiesto real para identificar el endpoint exacto que devuelve la DIM (y la DAM) por número, y verificar el JSON de respuesta; documentar el mapeo de los códigos del formulario (E11, E16, H7, H8.2, C2, C4, C7, C8, A7, H11, L) a los nombres del JSON.
- [x] 2.2 Verificar la equivalencia de campos entre DIM y DAM (qué campos faltan o cambian de nombre cuando no hay DIM); documentar las diferencias.
- [x] 2.3 Identificar el campo exacto de "fecha de registro de arribo" en el manifiesto/PRM y el endpoint de descarga de cada documento de "L. Documentos".

## 3. Backend — cliente de DIM/DAM

- [x] 3.1 Implementar la obtención de la declaración (DIM por `DI`, fallback a DAM) reutilizando `login` y headers; verificar con una declaración real que devuelve el JSON esperado.
- [x] 3.2 Implementar el mapeo de campos del JSON a un objeto `combustibles` (incluyendo `us_unitario` × 1000, `tramo_flete`, `total_flete_usd` y `tarifa_flete_usd_m3`); verificar con datos reales que los valores coinciden con el formulario.
- [x] 3.3 Implementar la descarga de los documentos de "L. Documentos" a `documentos-despacho/{dim_dam}/`; verificar que los archivos se guardan.

## 4. Backend — ingestión y programación

- [x] 4.1 Implementar el filtro de tipo de embalaje (`tipEmb.cod="VL"` y `des="LIQUIDO A GRANEL"`) sobre los ítems del PRM en la corrida de manifiestos; verificar que solo se procesan manifiestos de combustible.
- [x] 4.2 Implementar el upsert en `combustibles` por `dim_dam` (dedupe); verificar que re-ejecutar no duplica.
- [x] 4.3 Encadenar la corrida de combustibles después de la de manifiestos en el scheduler del sábado; verificar el orden PRMs → manifiestos → combustibles.

## 5. Backend — API REST

- [x] 5.1 Exponer `GET /api/combustibles?nit=`; verificar que devuelve las extracciones de un cliente.
- [x] 5.2 Exponer `GET /api/combustibles/:id/documentos` y la descarga de un documento; verificar que lista y descarga los documentos.
- [x] 5.3 Exponer `POST /api/ejecutar-combustibles` (con `nits` opcional); verificar que ejecuta una corrida limitada.

## 6. Frontend React

- [x] 6.1 Agregar la sección "Combustibles" a la barra lateral (selector de cliente + tabla de datos extraídos); verificar que muestra los campos.
- [x] 6.2 Agregar la descarga de documentos de despacho desde la sección; verificar que abre los archivos.

## 7. Integración y validación

- [x] 7.1 Levantar todo con `docker compose up --build` y verificar el flujo completo (PRMs → manifiestos filtrados → extracción → documentos) contra datos reales.
- [x] 7.2 Ejecutar la extracción con un par de clientes de prueba (vía `nits`) y verificar en la sección Combustibles que los datos y documentos aparecen sin duplicados.

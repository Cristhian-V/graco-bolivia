## 1. Base de datos

- [x] 1.1 Agregar las tablas de referencia `proveedores`, `productos`, `paises`, `incoterms`, `transportes` y las columnas `tipo`/`ciudad` en `aduanas` al esquema idempotente; verificar que el backend las aplica al arrancar.
- [x] 1.2 Generar el seed de las tablas de referencia y de `aduanas` (tipo/ciudad) desde `combustibles_export.xlsx`; verificar que se insertan sin duplicar.
- [x] 1.3 Agregar la columna `tarifa_flete_bob_m3` a `combustibles`; verificar con `psql`.

## 2. Backend — combustibles (tarifa y redondeo)

- [x] 2.1 Calcular `tarifa_flete_bob_m3 = flete_total_bs / cantidad_m3` en la extracción y el re-proceso; verificar con un registro real.
- [x] 2.2 Redondear a 2 decimales todos los campos numéricos al guardar; verificar que los valores quedan con 2 decimales.

## 3. Backend — exportación Excel

- [x] 3.1 Actualizar `GET /api/combustibles/export` para generar las 8 hojas en el orden del modelo, con `detalles` en 24 columnas (incluida `tarifa_flete_bob_m3`); verificar que el archivo se descarga con todas las hojas.
- [x] 3.2 Agregar el filtro `?mes=YYYY-MM` (aplica solo a `detalles`); verificar que la hoja `detalles` contiene solo el mes seleccionado y las hojas de referencia se descargan completas.

## 4. Backend — alta de referencias

- [x] 4.1 Exponer `POST /api/referencias/:tabla` (solo añadir, rechazando duplicados con 409); verificar el alta en cada tabla.
- [x] 4.2 Asegurar que el alta de un cliente lo crea con `activo = true`; verificar que entra en la siguiente corrida de los procesos.

## 5. Frontend React

- [x] 5.1 Agregar la sección "Referencias" con selector de tabla y formulario de alta (solo añadir); verificar que crea registros en las tablas de referencia.
- [x] 5.2 Agregar el selector mes/año en la descarga de Combustibles; verificar que descarga el mes seleccionado.

## 6. Integración y validación

- [x] 6.1 Cargar las tablas de referencia desde el Excel y verificar que los catálogos aparecen en la sección de Referencias.
- [x] 6.2 Re-procesar `combustibles` (redondeo + `tarifa_flete_bob_m3`) y descargar el Excel verificando el orden de columnas y el filtro por mes.

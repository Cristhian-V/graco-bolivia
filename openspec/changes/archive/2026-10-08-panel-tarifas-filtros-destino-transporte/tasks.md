## 1. Base de datos y backend

- [x] 1.1 Crear `db/init/014_destinos.sql` con la tabla `destinos(destino text PRIMARY KEY, departamento text NOT NULL)` y el seed de los 9 departamentos; verificar que el backend arranca sin error y que `SELECT * FROM destinos` devuelve 9 filas
- [x] 1.2 Quitar la agregación de transportes de `getTarifasTramo` (ya no devuelve `transportes`); verificar que la respuesta de `chart=tarifas` no incluye transportes
- [x] 1.3 Cambiar el filtro de `getTarifasTramo` de "departamento de destino" a "origen", extrayendo el origen de `tramo_flete` (`btrim(regexp_replace(tramo_flete, '\s*[-–].*$', ''))`); verificar que con `origen=IQUIQUE` solo devuelve tramos de ese origen
- [x] 1.4 Exponer las opciones de `origen` (distintos derivados de `detalles`) en `GET /api/dashboard/filters`; verificar que el endpoint devuelve los orígenes

## 2. Frontend: unidad y variación

- [x] 2.1 Agregar el segmentado `Bs · USD · Ambos` con default `Bs` y el título dinámico según la unidad; verificar los tres modos
- [x] 2.2 Renderizar las columnas según el modo y ocultar T/C fuera de `USD`; verificar cada modo
- [x] 2.3 Reactivar la variación solo en valor (sin porcentaje) con flecha, signo y color, y `–` sin mes anterior; verificar

## 3. Frontend: origen

- [x] 3.1 Cambiar el selector de "Destino" a "Origen" (opciones de `options.origen`, parámetro `origen`); verificar que al elegir un origen solo se listan sus tramos
- [x] 3.2 Quitar la columna "Transporte" y la expansión de fila; verificar que la tabla no la muestra

## 4. Referencias y verificación

- [x] 4.1 Registrar `destinos` en `TABLAS_REFERENCIA` (`routes/api.js`), en el export de referencias y en la lista `REFERENCIAS` de `App.jsx`; verificar que se puede dar de alta un destino desde Referencias
- [x] 4.2 Verificación integral: filtro de unidad y título, variación en valor, filtro de origen, ausencia de la columna de transporte, y alta de `destinos` en Referencias

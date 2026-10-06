## 1. Base de datos y backend

- [x] 1.1 Crear `db/init/014_destinos.sql` con la tabla `destinos(destino text PRIMARY KEY, departamento text NOT NULL)` y el seed de los 9 departamentos; verificar que el backend arranca sin error y que `SELECT * FROM destinos` devuelve 9 filas
- [x] 1.2 Agregar la agregación de transportes por tramo (`string_agg(DISTINCT NULLIF(BTRIM(transporte), ''), ' | ')`) en `getTarifasTramo` sobre los 3 períodos; verificar que un tramo con varias empresas devuelve la lista separada por `|`
- [x] 1.3 Implementar el filtro por departamento de destino en `getTarifasTramo` parseando el destino de `tramo_flete` (`btrim(regexp_replace(tramo_flete, '^.*[-–]\s*', ''))`) y uniéndolo con `destinos`; verificar que con `departamento=Santa Cruz` solo devuelve tramos de Santa Cruz
- [x] 1.4 Exponer las opciones de `departamento` (distintos de `destinos`) en `GET /api/dashboard/filters`; verificar que el endpoint devuelve los 9 departamentos

## 2. Frontend: unidad y variación

- [x] 2.1 Agregar el segmentado `Bs · USD · Ambos` con default `Bs` y el título dinámico según la unidad; verificar los tres modos
- [x] 2.2 Renderizar las columnas según el modo (`Bs` → Bs/m³; `USD` → USD/m³ + T/C; `Ambos` → Bs/m³ + USD/m³) y ocultar T/C fuera de `USD`; verificar cada modo
- [x] 2.3 Reactivar la variación solo en valor (sin porcentaje) con flecha, signo y color, y `–` sin mes anterior; en modo `Ambos`, dos subvalores (Bs y USD) bajo un encabezado de variación; verificar

## 3. Frontend: destino y transporte

- [x] 3.1 Agregar el selector de destino (`Todos` + departamentos) en la cabecera de la tabla de tarifas; verificar que al elegir un departamento solo se listan sus tramos
- [x] 3.2 Agregar la columna Transporte inmediatamente después de Tramo, con el nombre cuando es una sola empresa, el conteo cuando son varias y un guion cuando no hay; verificar los tres casos
- [x] 3.3 Implementar la expansión de la fila para mostrar los transportes cuando son varios (patrón de la tabla semanal); verificar que despliega y oculta la lista

## 4. Referencias y verificación

- [x] 4.1 Registrar `destinos` en `TABLAS_REFERENCIA` (`routes/api.js`), en el export de referencias y en la lista `REFERENCIAS` de `App.jsx`; verificar que se puede dar de alta un destino desde Referencias
- [ ] 4.2 Verificación integral: filtro de unidad y título, variación en valor, filtro de destino, columna y expansión de transporte, y alta de `destinos` en Referencias

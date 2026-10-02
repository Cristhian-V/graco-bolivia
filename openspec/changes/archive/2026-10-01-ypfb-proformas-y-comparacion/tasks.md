## 1. Base de datos

- [x] 1.1 Crear `db/init/012_ypfb_proformas.sql` con la tabla `ypfb_proformas` (`dim_dam` PK, `nro_proforma`, `premio`, `flete`, `precio_unitario`, `actualizado_en`) y verificar que el backend la crea al arrancar (`esquema aplicado (12 archivos sql)`)

## 2. Backend

- [x] 2.1 En `GET /combustibles`, hacer `LEFT JOIN ypfb_proformas` para incluir `nro_proforma`, `premio`, `flete`, `precio_unitario` en cada fila; verificar con `curl` que un registro de YPFB trae los campos (nulos si no se editaron)
- [x] 2.2 En `PUT /combustibles/:id`, guardar los cuatro campos en `ypfb_proformas` cuando el registro es de YPFB (NIT `1020269020`); verificar que un registro de otro cliente ignora esos campos
- [x] 2.3 Agregar la rama `chart=diesel-ypfb` en `getDashboardData` (detalles JOIN ypfb_proformas, filtro YPFB + anio/mes/incoterm/suministro; devuelve filas crudas con proforma, proveedor, pais_procedencia, incoterm, fecha, volumen, premio, flete, precio); verificar con `curl`

## 3. Frontend — edición de Combustibles

- [x] 3.1 En el formulario de edición, mostrar `nro_proforma`, `premio`, `flete`, `precio_unitario` solo cuando el registro es de YPFB, precargando `nro_proforma` desde la factura comercial si está vacío; verificar `vite build`

## 4. Frontend — sección de comparación

- [x] 4.1 Crear `YpfbComparacion` (tabla jerárquica por proveedor con sub-filas por país, promedio YPFB ponderado, filtros Incoterm/Suministro/mes/año) y colocarla después de la tabla de tarifa de flete por tramo en Bs/m³; estilos en `index.css`
- [x] 4.2 Verificar el orden por precio ascendente, los filtros y el caso sin datos

## 5. Validación

- [x] 5.1 Verificar end-to-end (editar un YPFB y verlo reflejado en la sección) y validar con `openspec validate ypfb-proformas-y-comparacion`

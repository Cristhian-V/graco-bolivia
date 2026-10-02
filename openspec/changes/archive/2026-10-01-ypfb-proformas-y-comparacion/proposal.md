## Why

YPFB importa diésel y su comparación de precio por proveedor requiere datos que no vienen en la DIM (número de proforma de la factura comercial, premio, flete y precio unitario de la proforma). Hoy no hay dónde guardarlos. Se necesita una tabla liviana de YPFB, que esos campos se ingresen desde la edición de Combustibles (solo para YPFB) y una sección nueva que compare el precio unitario por proveedor.

## What Changes

- Nueva tabla liviana `ypfb_proformas` (clave `dim_dam`, solo YPFB por NIT `1020269020`) con `nro_proforma`, `premio`, `flete` y `precio_unitario`.
- El botón **Editar** de la sección Combustibles, cuando el registro es de YPFB, muestra y guarda esos cuatro campos (premio, flete y precio unitario en USD/m³; el `nro_proforma` se precarga desde la factura comercial de la sección Documentos). Para clientes que no son YPFB no se muestran ni se guardan.
- Nueva sección en Presentación **"Diésel YPFB · Comparación de precio unitario por proveedor (USD/m³)"**, después de la tabla "Tarifa Flete Prom. por Tramo (Bs/m³)", con la estructura del HTML `tabla-diesel-ypfb.html`: tabla jerárquica Proveedor → sub-filas por `pais_procedencia`, con filtros Incoterm, Suministro, mes y año, y promedio ponderado por volumen.

## Capabilities

### New Capabilities
- `ypfb-diesel`: tabla de proformas de YPFB, edición de sus campos y sección de comparación de precio unitario por proveedor.

### Modified Capabilities
- `presentacion-datos`: el panel incorpora la sección de comparación Diésel YPFB.

## Impact

- **Base de datos**: nueva tabla `ypfb_proformas` (`db/init/012_ypfb_proformas.sql`).
- **Backend**: `presentacionService.js` (agregación `chart=diesel-ypfb`), `api.js` (guardar campos YPFB en `PUT /combustibles/:id`, incluir los campos en `GET /combustibles`).
- **Frontend**: `App.jsx` (formulario de edición con campos extra para YPFB), `DashboardSection.jsx` (nueva sección), `index.css`.
- Sin cambios en el scraper.

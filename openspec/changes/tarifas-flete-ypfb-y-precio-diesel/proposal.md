## Why

YPFB actualiza periódicamente las tarifas flete PAC-711 que aplica con sus proveedores de transporte, pero hoy no existe un lugar en el sistema para cargarlas ni consultarlas. Como consecuencia, la comparación de precio unitario de diésel de YPFB usa únicamente el flete de la proforma y no refleja el flete vigente ni permite analizar el desglose producto/premio/flete. Además, el Excel de tarifas se administra fuera del sistema y cada actualización obliga a trabajar manualmente.

## What Changes

- Nueva sección **Tarifas Flete YPFB** que replica la hoja `Consolidado` del Excel de tarifas (180 rutas) con sus 10 columnas, más las hojas resumen calculadas por el sistema.
- Carga de un archivo `.xlsx` por parte del administrador, con **preview y diff** (rutas nuevas, actualizadas y sin cambio) antes de aplicar.
- **Versionado por vigencia**: cada carga crea una versión con `vigente_desde` (fecha editable, por defecto el día de la carga). La ruta conserva su historial de tarifas.
- Actualización de montos de las rutas existentes y alta de las rutas nuevas; las rutas que no aparecen en el Excel cargado se marcan como inactivas para esa versión.
- Acceso: `admin` carga y actualiza; `presentacion` solo lectura.
- Adecuación del gráfico **Diésel YPFB · Comparación de precio unitario por proveedor (USD/m³)** al modelo `diesel_ypfb_precio_flete.html`:
  - selector de tramo por país alimentado por las tarifas cargadas;
  - tipo de cambio del día desde `tipo_cambio`, editable;
  - para DAP/DPU, flete = tarifa Bs/m³ ÷ TC; para FCA se mantiene el flete de la proforma;
  - vista **Precio unitario** y vista **Premio y flete** (producto, premio y flete);
  - aviso y opción de incluir/excluir registros sin precio;
  - filtros híbridos: se conserva el panel global actual y se agregan los controles del encabezado del modelo;
  - sin filtro de modalidad y limitado a YPFB (no incluye importadores privados).

## Capabilities

### New Capabilities
- `tarifas-flete-ypfb`: sección, almacenamiento versionado, carga desde Excel y consulta de las tarifas flete de YPFB.

### Modified Capabilities
- `ypfb-diesel`: la comparación de precio unitario incorpora tramo/tarifa, tipo de cambio, conversión de flete, vista premio/flete y manejo de registros sin precio.
- `autenticacion`: el rol `presentacion` obtiene lectura de la nueva sección y la sección se agrega a su menú; la escritura queda para `admin`.

## Impact

- **Base de datos**: nueva tabla de tarifas flete YPFB con versionado por vigencia, más migración idempotente en `db/init/`.
- **Backend**: nuevo servicio y rutas para listar, previsualizar/aplicar el Excel y consultar resúmenes; ampliación de la consulta de diésel YPFB para entregar tarifas vigentes y tipo de cambio; control de acceso por rol.
- **Frontend**: nueva sección en `App.jsx`/`api.js`, adecuación de `YpfbComparacion` en `DashboardSection.jsx` y estilos asociados.
- **Dependencias**: se reutilizan SheetJS/ExcelJS ya presentes; no se agregan librerías.
- **Compatibilidad**: sin tarifas cargadas el gráfico sigue funcionando con el flete de la proforma; no hay cambios disruptivos.

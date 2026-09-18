## Why

El panel de Presentación muestra todos los gráficos con un único juego de filtros globales, lo que impide comparar, por ejemplo, el desempeño de un importador contra el resto de clientes en la misma vista. Además, no se puede acotar por rango de fechas y faltan vistas clave de análisis (precio ponderado semanal, dispersión por empresa en Bs/litro).

## What Changes

- **Eliminación de los filtros globales** del panel: los filtros pasan a ser independientes y por gráfico, ubicados minimizados en la cabecera de cada gráfico. **BREAKING** (cambia el modelo de interacción actual).
- Filtros por gráfico: importadores (checklist por NIT + nombre), meses, procedencia, proveedor, aduana y un calendario de rango de fechas. Cada gráfico nace sin filtros (default = todos los datos).
- El rango de fechas manual convive con el filtro de meses: al seleccionar un rango manual se desactiva cualquier mes elegido.
- Los KPIs dejan de responder a los filtros de los gráficos: siempre muestran el promedio y los totales globales de todos los clientes (respetando la pestaña DIESEL/GASOLINA).
- Nuevo gráfico-tabla semanal con columnas: `semana`, `importadores` (oculto por defecto, se expande al hacer clic mostrando los importadores separados por `|`), `importacion` (precio promedio ponderado USD/m³), `marcador` (promedio de `us_precio_marcador`) y `spread` (importación − marcador).
- Nuevo gráfico de burbujas por empresa importadora: eje X empresa, eje Y precio promedio de importación en Bs/litro, tamaño de burbuja = volumen importado, con líneas horizontales de referencia en 18 Bs/litro y 16.5 Bs/litro.
- Nuevo gráfico de burbujas idéntico al anterior pero limitado al cliente YPFB.
- Fórmula de precio ponderado que incluye el flete:
  - `precio_op (USD/m³) = us_unitario + tarifa_flete_usd_m3`
  - `precio_op (Bs/litro) = (us_unitario + tarifa_flete_usd_m3) / 1000 × tipo_cambio_dim`
  - `importacion_ponderada = Σ(precio_op × cantidad_m3) / Σ(cantidad_m3)`

## Capabilities

### New Capabilities

<!-- Ninguna: toda la funcionalidad pertenece al panel de presentación existente. -->

### Modified Capabilities

- `presentacion-datos`: filtros independientes por gráfico, rango de fechas, KPIs globales, tabla semanal de precios ponderados y gráficos de burbujas (general y YPFB) en Bs/litro.

## Impact

- **Frontend**: `frontend/src/DashboardSection.jsx` (filtros por gráfico, nuevos gráficos D3/tabla), `frontend/src/api.js` (parámetros de filtros por gráfico y rango de fechas), `frontend/src/index.css` (UI de filtros minimizados, tabla semanal, burbujas).
- **Backend**: `backend/src/services/presentacionService.js` (`buildWhere` con rango de fechas, agregaciones semanales y de burbujas), `backend/src/routes/api.js` (endpoints `/dashboard/*`).
- **Datos**: usa columnas existentes de `detalles` (`us_unitario`, `cantidad_m3`, `tarifa_flete_usd_m3`, `tipo_cambio_dim`, `us_precio_marcador`, `importador`, `importador_nit`, `fecha`). No requiere cambios de esquema.

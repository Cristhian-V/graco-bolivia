## 1. Backend — filtros y rango de fechas

- [x] 1.1 Agregar `desde`/`hasta` a `buildWhere` en `presentacionService.js` y hacer que, si hay rango, se ignore `mes`. Verificar con `curl "localhost:3000/api/dashboard/data?producto=DIESEL&desde=2026-08-27&hasta=2026-09-02"` devolviendo solo registros de ese rango.
- [x] 1.2 Crear `GET /dashboard/kpis` (global, solo `producto`) en `routes/api.js` + `presentacionService.js`, reutilizando el SQL de KPIs actual. Verificar con `curl "localhost:3000/api/dashboard/kpis?producto=DIESEL"` devolviendo los 8 KPIs.
- [x] 1.3 Extender `GET /dashboard/data` para aceptar `chart=weekly` con agregación semanal (`date_trunc('week', fecha)`, importación ponderada con flete, marcador, `string_agg` de importadores). Verificar con `curl ".../dashboard/data?chart=weekly&producto=DIESEL"` devolviendo una fila por semana lunes→domingo.

## 2. Backend — agregados de burbujas e importadores por NIT

- [x] 2.1 Extender `GET /dashboard/data` con `chart=burbujas`: precio ponderado en Bs/litro por fila (`(us_unitario + COALESCE(tarifa_flete_usd_m3,0))/1000*tipo_cambio_dim`) y volumen por importador. Verificar con `curl ".../dashboard/data?chart=burbujas&producto=DIESEL"` devolviendo empresa, precio_bs_litro y volumen.
- [x] 2.2 Agregar variante YPFB de burbujas (filtro por `importador_nit = '1020269020'` con caída a `importador = 'YPFB'`). Verificar con `curl ".../dashboard/data?chart=burbujas&producto=DIESEL&nit=1020269020"` devolviendo solo YPFB (o vacío si no hay datos).
- [x] 2.3 Cambiar `getDashboardFilters` para devolver importadores como `{ value, label, nit }` y ajustar `buildWhere` para filtrar `importador_nit`/`importador`. Verificar con `curl "localhost:3000/api/dashboard/filters"` devolviendo la lista de importadores con NIT.

## 3. Frontend — refactor a tarjetas con filtros propios

- [x] 3.1 Extraer un componente reutilizable de tarjeta de gráfico con cabecera de filtros minimizada (desplegable) y estado de filtros propio por tarjeta. Verificar en el navegador que cada tarjeta colapsa/expande sus filtros sin afectar a las demás.
- [x] 3.2 Cargar los KPIs desde `/dashboard/kpis` una vez por cambio de pestaña (DIESEL/GASOLINA), sin filtros de gráfico. Verificar que los KPIs no cambian al mover filtros de un gráfico.
- [x] 3.3 Implementar en cada tarjeta: checklist de importadores (por NIT + nombre), multiselects de mes/procedencia/proveedor/aduana y calendario de rango; al elegir rango se limpia el mes. Verificar que cambiar un filtro recalcula solo ese gráfico.
- [x] 3.4 Actualizar `api.js` con `getDashboardKpis` y parámetros `chart`/`desde`/`hasta` en `getDashboardData`. Verificar en la pestaña Red del navegador las peticiones por gráfico.

## 4. Frontend — nuevos gráficos

- [x] 4.1 Renderizar la tabla semanal como HTML `<table>` con columna `importadores` colapsada y expandible al clic (separador `|`). Verificar que una fila muestra `27 Ago - 02 Sep` con su importación/marcador/spread y expande los importadores.
- [x] 4.2 Implementar `d3Bubble` (eje X empresa, eje Y Bs/litro, radio ∝ volumen, líneas horizontales en 18 y 16.5 Bs/litro). Verificar burbujas con tooltip de precio y volumen y las dos líneas de referencia.
- [x] 4.3 Crear la tarjeta de burbujas de YPFB usando la variante de burbujas filtrada. Verificar que muestra solo YPFB (o vacío con líneas si aún no hay datos).

## 5. Estilos e integración

- [x] 5.1 Agregar estilos CSS para filtros minimizados, tabla semanal y tooltip de burbujas en `index.css`. Verificar visual en escritorio y móvil.
- [x] 5.2 Verificación integral con `docker compose up --build`: KPIs globales estables, filtros independientes por gráfico, rango de fechas desactiva el mes, tabla semanal expandible, burbujas con líneas 18/16.5 y gráfico YPFB. Verificar que la sección Combustibles/exportación Excel no se ve afectada.

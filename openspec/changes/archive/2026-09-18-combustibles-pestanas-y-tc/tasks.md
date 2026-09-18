## 1. Backend — paginación y pendientes

- [x] 1.1 `GET /combustibles`: aceptar `pagina` (1-based), `limite` (default 100) y `tipo` (`historial`|`pendientes`); responder `{ total, totalHistorial, totalPendientes, pagina, limite, filas }`; excluir `raw` del SELECT; ordenar por `fecha DESC NULLS LAST, dim_dam`. Verificar: la respuesta trae 100 filas y el total.
- [x] 1.2 Aplicar el predicado de pendientes en SQL. Verificar: Pendientes devuelve 88 y no incluye filas ya revisadas.

## 2. Backend — tipo de cambio

- [x] 2.1 `sincronizarTipoCambioCombustibles()` en `tipoCambioService.js`. Verificar: los 86 registros con `tipo_cambio_trans` nulo se completaron (quedan 0).
- [x] 2.2 Endpoint manual `POST /tipo-cambio/sincronizar-combustibles`. Verificar: responde `{ fechasFaltantes, cotizaciones, sinCotizacion, actualizados }`.
- [x] 2.3 Cadena diaria (`index.js`): actualizar `tipo_cambio` del período en curso y sincronizar combustibles. Verificar: el log muestra ambos pasos.

## 3. Frontend — pestañas, paginación y alertas

- [x] 3.1 `api.js`: `getCombustibles(nit, pagina, tipo)` y `sincronizarTipoCambioCombustibles()`. Verificar: build OK.
- [x] 3.2 Tabs Historial/Pendientes con contadores, paginación y barra compartida arriba. Verificar: cambiar de pestaña y de página refresca.
- [x] 3.3 Alertas: prioridad rojo > violeta > amarillo; `us_unitario`>5000 en violeta; "Ignorar" solo para tarifa. Verificar.
- [x] 3.4 CSS: clase `soft-violet` y estilos de paginación/leyenda. Verificar: build OK.
- [x] 3.5 Botón **Refrescar** que aplica el mes del selector (`mesFiltro`) y recarga; `GET /combustibles` acepta `mes`. Verificar: elegir un mes y refrescar trae solo ese mes (en la pestaña activa).

## 4. Verificación integral

- [x] 4.1 Desplegado; sincronización corrida (7 cotizaciones, 86 registros); `tipo_cambio_trans` nulo bajó de 86 a 0; Historial/Pendientes y paginación funcionando.

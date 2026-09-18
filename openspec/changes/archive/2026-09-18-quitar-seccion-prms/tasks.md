## 1. Frontend

- [x] 1.1 Quitar la sección PRMs de `App.jsx`: componentes `Registros`, `Resumen`, `Historico`, `PrmsSection`; entrada en `SECTIONS`; navegación/render; sección por defecto (`aduanas`). Verificar: build OK y sin referencias.
- [x] 1.2 Quitar de `api.js`: `getPrms`, `getResumen`, `getHistorico`, `ejecutarPrms`.

## 2. Backend

- [x] 2.1 Quitar las rutas `GET /clientes/:nit/prms`, `GET /resumen`, `GET /historico`, `POST /ejecutar` y el import de `executeRun`.
- [x] 2.2 Eliminar `services/runService.js` y `scraper/prm.js`; quitar `config.prmTimeoutMs`.

## 3. Verificación

- [x] 3.1 Desplegar; `/api/resumen`, `/api/historico`, `/api/ejecutar` → 404; frontend build OK.
- [x] 3.2 Verificar orfandad: ninguna consulta lee/escribe `prm` ni `resumen_mensual`.

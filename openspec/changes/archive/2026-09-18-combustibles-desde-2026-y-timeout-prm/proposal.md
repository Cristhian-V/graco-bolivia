## Why

La extracción de combustibles recorre **todos** los manifiestos con DIM **sin filtro de fecha**, por lo que también procesa declaraciones de 2024 y 2025 (315 filas) que ya no interesan. Además, un cliente nuevo con historial enorme (YPFB: 475.852 PRMs) hace que la primera página tarde más que el timeout de 20 s y falle.

## What Changes

- La corrida de extracción de combustibles SHALL procesar únicamente manifiestos con `fecha` a partir de la fecha inicial configurada (por defecto **2026-01-01**).
- El timeout de las peticiones de PRMs sube y queda configurable, para tolerar clientes con historiales grandes (se comprobó que enviar `fecTra` en el filtro **no** acota la consulta en el servidor de la aduana).

## Capabilities

### New Capabilities

<!-- ninguna -->

### Modified Capabilities

- `combustibles`: la corrida de extracción filtra por fecha desde el inicio configurado (2026-01-01).
- `prm-scraping`: timeout de peticiones ampliado y configurable.

## Impact

- **Backend**: `backend/src/services/combustiblesService.js` (`desde` por defecto), `backend/src/scraper/prm.js` (timeout), `backend/src/config.js` (nuevo `prmTimeoutMs`).
- **Sin migraciones ni dependencias nuevas.**

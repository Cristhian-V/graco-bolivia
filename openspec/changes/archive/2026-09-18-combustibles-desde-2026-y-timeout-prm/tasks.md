## 1. Combustibles desde 2026

- [x] 1.1 `combustiblesService.js`: en `runCombustibles`, usar `desde = desde || config.fechaDesde`. Verificar: la corrida ahora ve 2763 manifiestos (antes 3098), excluye los 335 anteriores a 2026.
- [x] 1.2 Verificar que no se procesan manifiestos anteriores a 2026-01-01 (los 10 `DI-2025-` tienen fecha 2026-01-01/02, así que corresponden al rango).

## 2. Timeout de PRMs

- [x] 2.1 `config.js`: nuevo `prmTimeoutMs` (default 120000). Verificar: el contenedor lo reporta.
- [x] 2.2 `prm.js`: usar `config.prmTimeoutMs`. Verificar: ya no aborta a los 20 s.

## 3. Despliegue

- [x] 3.1 Backend reconstruido y recreado; `/health` OK y configuración aplicada (`fechaDesde=2026-01-01`, `prmTimeoutMs=120000`).

## Context

`runCombustibles` (`combustiblesService.js`) selecciona manifiestos con `di IS NOT NULL` y **solo** aplica el filtro de fecha si recibe `desde`/`hasta`. Ni la cadena diaria (`executeCombustiblesRun({})`) ni el botón del panel pasan un rango, así que procesa **todo** el histórico de manifiestos: hay **315 filas** de combustibles de 2024–2025 (y 21/314 manifiestos con DI de esos años). La función ya soporta `desde`/`hasta`; solo falta el valor por defecto.

En paralelo, la medición en vivo para YPFB (NIT 1020269020): `countPrms` → **475.856** en ~440 ms, pero `fetchPrmsPage(page=0,size=100)` supera los 20 s y lanza `TimeoutError` (`AbortSignal.timeout(20000)` en `prm.js`). Se probó enviar `fecTra` (y `fecEstAct`) en el cuerpo de `countParteRecepcionByNumPrmAndImpAndDe`: el conteo **no cambia** (475856), o sea el servidor ignora ese filtro.

## Goals / Non-Goals

**Goals:**
- Que la corrida de combustibles procese solo manifiestos desde 2026-01-01.
- Que un cliente grande no falle por el timeout de una página.

**Non-Goals:**
- No se borran datos existentes (las 315 filas viejas quedan; ver Riesgos).
- No se cambia la forma de paginar ni la API de la aduana.

## Decisions

### 1. Fecha inicial por defecto en la corrida de combustibles
`runCombustibles` toma `desde = desde || config.fechaDesde` (2026-01-01), de modo que la consulta queda `... AND fecha >= $desde`. No hace falta cambiar las llamadas (cadena diaria y ruta ya mandan `desde` opcional).

### 2. Timeout de PRMs amplio y configurable
Nuevo `config.prmTimeoutMs` (default **120000** ms) usado por `prm.js`. Se eligió ampliar el timeout en lugar de “filtrar por `fecTra`” porque el servidor **no** aplica ese filtro (comprobado). *Alternativa descartada*: reducir `size`; no cambia la latencia del servidor.

## Risks / Trade-offs

- **Datos viejos existentes**: las 315 filas de 2024–2025 seguirán en `combustibles`; el cambio solo evita procesar más. → Si se quieren quitar, es un borrado aparte (requiere confirmación).
- **Timeout alto**: una página del servidor podría tardar hasta 120 s; la corrida se vuelve más lenta para clientes grandes. → Es preferible a fallar; el `delayMs` entre páginas sigue aplicando.
- **`fecTra` no filtra**: se descarta ese camino con evidencia.

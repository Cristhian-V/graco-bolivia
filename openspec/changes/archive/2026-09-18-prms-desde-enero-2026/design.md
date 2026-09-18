## Context

`config.fechaDesde` (default `2026-07-01`, también en `.env`) es la fecha inicial del backfill de PRMs; la corrida diaria usa el mes en curso (`rangoMes`). Evidencia medida en vivo para YPFB (NIT 1020269020): `countPrms` devuelve **475.852** en ~440 ms, pero `fetchPrmsPage(page=0,size=100)` **supera los 20 s** y lanza `TimeoutError` (el fetch usa `AbortSignal.timeout(20000)`).

## Goals / Non-Goals

**Goals:**
- Acotar la extracción a partir de enero de 2026 para todos los clientes.

**Non-Goals:**
- No se cambia el mecanismo de paginación ni la API de la aduana.
- No se aborda aquí la latencia del servidor de la aduana.

## Decisions

### 1. Fecha inicial por defecto 2026-01-01
`config.fechaDesde` y `.env` pasan de `2026-07-01` a `2026-01-01`. Aplica al backfill manual (ruta `/ejecutar` sin rango). El filtro sigue siendo client-side (la API no acepta rango de fechas).

### 2. Observación sobre el timeout
La latencia que provoca el error es de la **primera página** en el servidor de la aduana (no depende del rango). Acotar la fecha limita hasta dónde se recorre el historial, pero no la latencia de la página 0. Se recomienda, como medida complementaria, ampliar el timeout del fetch de PRMs (hoy 20 s) y/o explorar el filtro `fecTra` del cuerpo `ParteRecepcion`.

## Risks / Trade-offs

- **Enero 2026 es más amplio que julio 2026**: el backfill cubrirá más meses (más páginas), no menos. Si el objetivo era *reducir* el rango, habría que usar una fecha más reciente. → Se deja explícito para confirmación.
- **El timeout de la página 0 persiste**: la fecha no lo resuelve por sí sola. → Medida complementaria propuesta.

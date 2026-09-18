## Context

Ver `proposal.md`. Tras `manifiestos-sin-prms`, el único consumidor automatizado de la tabla `prm` desapareció. Se confirmó con búsqueda en el código: **ninguna** consulta lee o escribe `prm` ni la vista `resumen_mensual`.

## Goals / Non-Goals

**Goals:**
- Eliminar la sección PRMs y su código asociado (UI, endpoints y extracción).

**Non-Goals:**
- No se borran los datos existentes de `prm` en este cambio (ver Riesgos / Migración).
- No se tocan los demás scrapers (manifiestos, combustibles) ni el dashboard.

## Decisions

### 1. Eliminación completa de la funcionalidad
Se quitan la sección del frontend, sus llamadas de API, las rutas de backend y los módulos `runService.js` y `scraper/prm.js`. `config.prmTimeoutMs` queda sin uso y se elimina.

### 2. La tabla `prm` queda huérfana
Ninguna consulta la usa. La vista `resumen_mensual` (dependiente de `prm`) también. Se decide **no borrarlas en este cambio**: el drop es destructivo (32.509 filas, 82 MB) y conviene confirmarlo aparte.

## Risks / Trade-offs

- **Datos históricos de PRMs**: si algún día se necesitan, quedan en la tabla. → Se conserva hasta decisión explícita.
- **Esquema**: `db/init/001_schema.sql` sigue creando `prm` y `resumen_mensual`. → Si se confirma el drop, se quitan del esquema y se agrega la migración de borrado.
- **Cambios activos de PRMs** (`prms-desde-enero-2026`, `corte-incremental-con-huecos`) quedan obsoletos; archivar este cambio después de ellos para evitar conflictos de cabeceras.

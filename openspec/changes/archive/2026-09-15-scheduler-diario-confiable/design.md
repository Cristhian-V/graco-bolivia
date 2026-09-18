## Context

El scheduler vivía en `backend/src/index.js`: un `cron.schedule(config.cron, ...)` con `SCHEDULER_CRON=0 17 * * *` (17:00 **UTC** = 13:00 Bolivia), sin recuperación de corridas perdidas y sin política de reinicio en `docker-compose.yml` (`RestartPolicy=no`). Cuando el backend estaba detenido o se reiniciaba alrededor de las 17:00, la corrida del día se perdía y no se recuperaba. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Corrida diaria a las 15:00 hora Bolivia, configurable.
- Recuperar la corrida del día si el backend no estuvo disponible a esa hora.
- Que el backend (y su scheduler) vuelvan solos tras una caída o reinicio.

**Non-Goals:**
- No se cambia la lógica de extracción ni el procesamiento incremental.
- No se introduce un planificador externo (se mantiene `node-cron` en el proceso).

## Decisions

### 1. Zona horaria y hora
`TZ=America/La_Paz` en el backend y `timezone` explícito en `cron.schedule`, con `SCHEDULER_CRON=0 15 * * *` (15:00 Bolivia). Los cálculos de fecha/hora internos usan `Intl.DateTimeFormat` con `timeZone: 'America/La_Paz'`, de modo que no dependen del TZ del proceso. *Alternativa*: dejar el contenedor en UTC y poner `0 19 * * *`; descartada por legibilidad.

### 2. Recuperación de corridas perdidas
- **Al arranque**: si la hora local ya pasó la hora programada y no hay ejecución de hoy, se dispara la cadena (en segundo plano, sin bloquear `app.listen`).
- **Verificación periódica**: cada 10 minutos se repite la comprobación, para cubrir una suspensión que pase por encima de la hora.
- **Detección de "hoy"**: `corridaHechaHoy()` consulta `ejecuciones` con `(iniciado_en AT TIME ZONE 'America/La_Paz')::date = hoy`.
- **Guardas anti-duplicado**: una bandera en memoria (`corriendo`) y el chequeo en base; así el cron, el arranque y el intervalo no se pisan.

### 3. Reinicio automático
`restart: unless-stopped` en `db`, `backend` y `frontend`. Para no recrear el contenedor de base de datos (y evitar cortes), la política se aplicó a los contenedores en marcha con `docker update --restart unless-stopped` además de quedar escrita en el compose.

### 4. Semántica de "ya corrió hoy"
Se considera corrida hecha si existe **cualquier** ejecución del día (automática o manual). Un run manual del día evita el disparo automático duplicado. *Trade-off aceptado*: si el usuario corre manualmente una parte, el automático del día no se repite.

## Risks / Trade-offs

- **Catch-up al arrancar** dispara la cadena si el backend inicia después de la hora y no hubo corrida ese día. Es el comportamiento buscado, pero implica que un reinicio tardío hace correr el pipeline. → Mitigación: el procesamiento incremental lo hace corto.
- **Suspensión**: `node-cron` puede no disparar un tick si el sistema está suspendido en ese instante. → Mitigación: la verificación cada 10 min lo recupera al volver.
- **"Hoy" en zona Bolivia**: si el servidor cambia de zona, los cálculos siguen anclados a `America/La_Paz`.
- **Duplicados por reloj**: la bandera en memoria no cubre múltiples procesos. → Es un solo backend; si hubiera réplicas, haría falta un lock en base.

## Migration Plan

1. `.env`: `SCHEDULER_CRON=0 15 * * *` y `TZ=America/La_Paz`.
2. `docker-compose.yml`: `restart: unless-stopped` y `TZ` en el backend.
3. Rebuild y recrear el backend; aplicar la política de reinicio a `db`/`frontend` con `docker update`.
4. Verificación: en el arranque, el log muestra el catch-up y se crea una ejecución del día.
5. Rollback: revertir `.env`/compose y el `index.js`; no hay cambios de datos.

## Why

La corrida automática dejó de ejecutarse durante varios días: el backend quedaba detenido o se reiniciaba, los contenedores no tenían política de reinicio, y la hora programada (17:00 UTC = 13:00 Bolivia, semanal según las specs) no coincidía con la operación real. Tampoco había forma de recuperar una corrida perdida.

## What Changes

- **Corrida diaria programada**: la cadena completa (PRMs → manifiestos → combustibles) se ejecuta todos los días a la hora configurada, por defecto **15:00 en `America/La_Paz`**, en lugar de "semanal".
- **Recuperación de corridas perdidas**: si el backend arranca después de la hora programada y ese día no hubo corrida, la ejecuta; además verifica cada 10 minutos para cubrir suspensiones. No se duplica si ya hay una corrida del día.
- **Reinicio automático**: los servicios `db`, `backend` y `frontend` pasan a `restart: unless-stopped`, de modo que el backend (y su scheduler) vuelven solos tras una caída o reinicio.
- Zona horaria del backend fijada a `America/La_Paz` para que hora y cron sean en hora boliviana.

## Capabilities

### New Capabilities

- `programacion-corridas`: programación diaria de la cadena de extracción y recuperación de corridas perdidas.

### Modified Capabilities

- `combustibles`: se retira el requisito de "Programación semanal" (la programación se centraliza en `programacion-corridas`).
- `manifiestos`: se retira "Programación semanal" y se ajusta el filtro de fechas a corrida diaria.
- `prm-scraping`: se ajusta el escenario de filtro de fechas de corrida semanal a diaria.

## Impact

- **Backend**: `backend/src/index.js` (cron con zona horaria, catch-up al arranque y verificación periódica, guardas anti-duplicado), `backend/src/config.js` (hora por defecto 15:00).
- **Infraestructura**: `docker-compose.yml` (`restart: unless-stopped` en los tres servicios, `TZ` en el backend) y `.env` (`SCHEDULER_CRON=0 15 * * *`, `TZ=America/La_Paz`).
- **Sin dependencias nuevas**.

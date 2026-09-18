## 1. Configuración

- [x] 1.1 `.env`: `SCHEDULER_CRON=0 15 * * *` y `TZ=America/La_Paz`. Verificar: el contenedor backend muestra esas variables.
- [x] 1.2 `docker-compose.yml`: `restart: unless-stopped` en `db`, `backend` y `frontend`, y `TZ` (por defecto `America/La_Paz`) en el backend. Verificar: `docker inspect` muestra `restart=unless-stopped` en los tres.
- [x] 1.3 `config.js`: hora por defecto `0 15 * * *`.

## 2. Scheduler robusto

- [x] 2.1 `index.js`: registrar el cron con `timezone: America/La_Paz`; catch-up al arranque (si ya pasó la hora y no hubo corrida hoy); verificación cada 10 minutos; guardas anti-duplicado (`corriendo` + chequeo en `ejecuciones`). Verificar: el log muestra `[scheduler] registrado` y, tras un arranque después de la hora, `catch-up (arranque)`.

## 3. Despliegue y verificación

- [x] 3.1 Reconstruir y recrear el backend; aplicar `restart: unless-stopped` a `db` y `frontend` con `docker update` (sin recrear la base). Verificar: `docker ps` muestra los tres arriba y con política de reinicio.
- [x] 3.2 Verificar en caliente: el arranque detectó la corrida perdida y creó una ejecución del día. Verificar: `ejecuciones` tiene una fila `EN_PROCESO`/`OK` del día y el log muestra el avance de PRMs.

# Runbook: migración de la aplicación al VPS (Hostinger)

Migra la aplicación (base de datos + archivos) del equipo local a un VPS, con todo
en horario de Bolivia y con datos históricos preservados.

```
LOCAL (scrap_aduana)                     VPS (graco-bolivia)
┌───────────────────────┐               ┌───────────────────────────────┐
│ scrap_aduana-db-1      │  pg_dump      │ graco-bolivia-db-1 (restore)   │
│  volumen dbdata        │ ───────────▶  │ volumen dbdata                 │
│  volumen downloads     │  tar          │ volumen downloads              │
│  volumen documentos-…  │ ───────────▶  │ volumen documentos-despacho    │
│ proyecto (git)         │  git          │ graco-bolivia (repo clonado)   │
└───────────────────────┘               └───────────────────────────────┘
```

> Todos los comandos del VPS se ejecutan como root o con `sudo`.
> Los `<...>` son valores a completar (IP, contraseñas).
>
> **Prerrequisito:** este runbook asume aplicado el cambio `despliegue-vps`
> (compose con `POSTGRES_PASSWORD` desde el `.env`, `TZ` en la DB y sin los
> puertos públicos de backend/frontend).

---

## 0. Requisitos previos

- VPS Ubuntu en Hostinger con **IP pública** y acceso SSH.
- Dominio **import-graco-bolivia.digital** con acceso al panel DNS.
- Repo: `https://github.com/Cristhian-V/graco-bolivia.git`
- El proyecto ya está **clonado en el VPS** dentro de la carpeta `graco-bolivia`.

Definí la ruta del proyecto una sola vez (ajustá si clonaste en otra ubicación):

```bash
export PROYECTO="$HOME/graco-bolivia"
cd "$PROYECTO"
```

> El `.env` define `COMPOSE_PROJECT_NAME=graco-bolivia`, así que los contenedores
> quedan `graco-bolivia-db-1`, etc. y los volúmenes `graco-bolivia_dbdata`,
> `graco-bolivia_downloads`, `graco-bolivia_documentos-despacho`, sin importar la
> ruta. (El origen local conserva los nombres `scrap_aduana_*`.)

---

## 1. Respaldo en el ORIGEN (equipo local)

```bash
cd /home/cristhian/ANGELA/scrap_aduana
mkdir -p /tmp/vps-migracion

# 1.1 Dump de la base de datos (formato custom, incluye datos y esquema)
docker exec scrap_aduana-db-1 pg_dump -U prm -d prm -Fc -f /tmp/prm.dump
docker cp scrap_aduana-db-1:/tmp/prm.dump /tmp/vps-migracion/prm.dump

# 1.2 Copia de los volúmenes de archivos
docker run --rm -v scrap_aduana_downloads:/v -v /tmp/vps-migracion:/b \
  alpine sh -c "tar czf /b/downloads.tgz -C /v ."
docker run --rm -v scrap_aduana_documentos-despacho:/v -v /tmp/vps-migracion:/b \
  alpine sh -c "tar czf /b/documentos-despacho.tgz -C /v ."

# 1.3 Verificar los artefactos
ls -lh /tmp/vps-migracion/
```

Quedan: `prm.dump`, `downloads.tgz`, `documentos-despacho.tgz` (~350 MB en total).

---

## 2. Preparar el VPS

```bash
# 2.1 Actualizar e instalar Docker + Compose
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version

# 2.2 Firewall: solo SSH, HTTP y HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 3. Configurar el proyecto en el VPS

El repo ya está clonado; entrá a la carpeta y creá el `.env`:

```bash
cd "$PROYECTO"
nano .env
```

Contenido del `.env` del VPS (valores fuertes; los generados para esta app):

```env
SUMA_USUARIO=CUMBRESYS
SUMA_PASSWORD=<password SUMA>
SUMA_BASE_URL=https://suma.aduana.gob.bo

PRM_FECHA_DESDE=2026-01-01
SCHEDULER_CRON=0 15 * * *
TZ=America/La_Paz

JWT_SECRET=<JWT_SECRET generado>
JWT_EXPIRES_IN=8h
ADMIN_PASSWORD=<ADMIN_PASSWORD generado>
POSTGRES_PASSWORD=<POSTGRES_PASSWORD generado>

COMPOSE_PROJECT_NAME=graco-bolivia
```

```bash
# 3.1 Copiar los respaldos (desde el equipo local, NO desde el VPS)
scp /tmp/vps-migracion/prm.dump \
    /tmp/vps-migracion/downloads.tgz \
    /tmp/vps-migracion/documentos-despacho.tgz \
    root@<IP_VPS>:"$PROYECTO"/
```

---

## 4. Desplegar y restaurar

```bash
cd "$PROYECTO"

# 4.1 Levantar solo la base (crea el volumen y el usuario prm)
docker compose up -d db
sleep 10

# 4.2 Restaurar la base (--clean reemplaza el esquema sembrado por los db/init)
docker cp prm.dump graco-bolivia-db-1:/tmp/prm.dump
docker exec graco-bolivia-db-1 pg_restore -U prm -d prm --clean --if-exists /tmp/prm.dump

# 4.3 Ajustar la contraseña del usuario a la del .env
docker exec graco-bolivia-db-1 psql -U prm -d prm -c \
  "ALTER USER prm WITH PASSWORD '<POSTGRES_PASSWORD generado>';"

# 4.4 Restaurar los volúmenes de archivos
docker run --rm -v graco-bolivia_downloads:/v -v "$PROYECTO":/b \
  alpine sh -c "cd /v && tar xzf /b/downloads.tgz"
docker run --rm -v graco-bolivia_documentos-despacho:/v -v "$PROYECTO":/b \
  alpine sh -c "cd /v && tar xzf /b/documentos-despacho.tgz"

# 4.5 Levantar todo (--profile prod activa Caddy)
docker compose --profile prod up -d --build
docker compose --profile prod ps
```

---

## 5. Dominio + HTTPS (Caddy)

Dominio: **import-graco-bolivia.digital**

1. **DNS** (en Hostinger o donde esté el dominio): registro **A**
   `import-graco-bolivia.digital → <IP_VPS>`. Verificar:
   `dig import-graco-bolivia.digital +short`.
2. El `Caddyfile` ya está en el repo:
   ```
   import-graco-bolivia.digital {
       reverse_proxy frontend:80
   }
   ```
3. Levantar con el perfil de producción: `docker compose --profile prod up -d`.
   Caddy emite el certificado Let's Encrypt automáticamente (requiere DNS ya
   propagado y 80/443 abiertos).
4. Verificar `https://import-graco-bolivia.digital`.

---

## 6. Verificación

```bash
# 6.1 Conteos de la BD migrada
docker exec graco-bolivia-db-1 psql -U prm -d prm -c \
  "SELECT (SELECT count(*) FROM clientes) clientes, (SELECT count(*) FROM tipo_cambio) tc,
          (SELECT count(*) FROM combustibles) comb, (SELECT count(*) FROM detalles) det;"

# 6.2 Historial de tipo de cambio presente (tu preocupación)
docker exec graco-bolivia-db-1 psql -U prm -d prm -c \
  "SELECT min(fecha), max(fecha), count(*) FROM tipo_cambio;"

# 6.3 Hora del backend (Bolivia), de la BD y cron
docker exec graco-bolivia-db-1 psql -U prm -d prm -tAc "show timezone;"
docker exec graco-bolivia-backend-1 sh -c 'echo TZ=$TZ; echo SCHEDULER_CRON=$SCHEDULER_CRON'
docker logs graco-bolivia-backend-1 2>&1 | grep scheduler

# 6.4 Puertos que NO deben estar abiertos al exterior: 3000 y 5432
ss -ltnp | grep -E ':(3000|5432)\b' || echo "OK: backend y db no expuestos"
```

---

## 7. Backups recomendados (en el VPS)

```bash
# Dump diario a /opt/backups (agregar a crontab)
mkdir -p /opt/backups

# Prueba manual
docker exec graco-bolivia-db-1 pg_dump -U prm -d prm -Fc -f /tmp/prm.dump
docker cp graco-bolivia-db-1:/tmp/prm.dump /opt/backups/prm_$(date +%F).dump
```

Sugerido en `crontab -e` (madrugada de Bolivia):
```
30 2 * * * docker exec graco-bolivia-db-1 pg_dump -U prm -d prm -Fc -f /tmp/prm.dump && docker cp graco-bolivia-db-1:/tmp/prm.dump /opt/backups/prm_$(date +\%F).dump
```

---

## Notas

- Para **desarrollo local** (puertos 3000/8080 expuestos, sin Caddy):
  `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d`.
- El arranque del backend aplica `db/init/*.sql` de forma idempotente; con la base
  restaurada no recrea nada.
- El **catch-up** dispara la cadena solo si arranca después de las 15:00 (Bolivia)
  sin corrida del día; con la BD migrada y la corrida del día hecha, no se dispara.
- `NODE_TLS_REJECT_UNAUTHORIZED=0` es necesario por la cadena TLS de SUMA; queda
  contenido en la red interna de Docker.

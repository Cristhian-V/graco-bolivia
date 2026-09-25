## Context

Ver `proposal.md`. Hoy: `docker-compose.yml` expone `backend:3000` y `frontend:8080` por HTTP; el `.env` tiene `JWT_SECRET` placeholder, `ADMIN_PASSWORD=admin123` y la BD usa `prm/prm` fijo; `db` sin `TZ`. Datos a migrar: BD 48 MB + volúmenes `downloads` (167 MB) y `documentos-despacho` (130 MB).

## Goals / Non-Goals

**Goals:**
- Publicar por dominio con HTTPS; contenedores en hora Bolivia; secretos fuertes; migrar los datos.

**Non-Goals:**
- No se cambia código de la aplicación.
- No se monta alta disponibilidad ni orquestador (Kubernetes).

## Decisions

### 1. Reverse proxy con Caddy
Se agrega un servicio `caddy` con un `Caddyfile`:
```
<dominio> {
  reverse_proxy frontend:80
}
```
Caddy obtiene y renueva el certificado de Let's Encrypt automáticamente (requiere DNS del dominio apuntando al VPS y 80/443 abiertos). *Alternativa*: nginx + certbot (renovación manual). Se elige Caddy por simplicidad.

### 2. Puertos: solo 80/443
Se quita `3000:3000` del backend y `8080:80` del frontend (quedan solo en la red interna de Docker). El único expuesto es `caddy` (`80:80`, `443:443`). El enrutado: `dominio → caddy → frontend:80 → (nginx /api → backend:3000)`.

### 3. Zona horaria
Se agrega `TZ=${TZ:-America/La_Paz}` al servicio `db` (el backend ya lo tiene). El cron sigue `0 15 * * *`. Las fechas `date` y los `timestamptz` no cambian de semántica (UTC interno), pero la sesión y los logs quedan en hora Bolivia.

### 4. Secretos por entorno
`.env` en el VPS (no versionado) con: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, credenciales SUMA y `TZ`. El compose los toma con `${...}`. La BD deja de usar `prm/prm`.
> Con un volumen migrado, el `POSTGRES_PASSWORD` **no** re-inicializa la contraseña; hay que ejecutar `ALTER USER prm WITH PASSWORD '<nuevo>'` una vez tras el restore.

### 5. Migración de datos (Opción A)
1. Origen: `pg_dump -Fc -U prm prm > prm.dump` y `tar` de los volúmenes `downloads` y `documentos-despacho`.
2. VPS: crear el stack (volúmenes nuevos), restaurar el dump (`pg_restore`) y descomprimir los volúmenes.
3. Ajustar la contraseña del usuario `prm` tras el restore.
4. Los `db/init/*.sql` se aplican idempotentes al arrancar el backend.

### 6. Repositorio git
Inicializar el repo, `.gitignore` ya excluye `.env`, `node_modules`, `dist`. El VPS clona y `docker compose up -d --build`. El `.env` se crea aparte (scp) con los valores fuertes.

## Risks / Trade-offs

- **Certificado TLS**: requiere que el dominio apunte al VPS y 80/443 estén abiertos; si no, Caddy no emite el certificado. → Verificación con el DNS antes.
- **Contraseña de BD tras restore**: el `POSTGRES_PASSWORD` no cambia el volumen migrado. → `ALTER USER` explícito.
- **TLS de SUMA desactivado** (`NODE_TLS_REJECT_UNAUTHORIZED=0`): necesario por la cadena incompleta; queda solo en la red interna.
- **Sin backups automáticos**: → se recomienda un cron de `pg_dump`.

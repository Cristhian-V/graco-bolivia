## 1. Repositorio y secretos

- [x] 1.1 Inicializar git (`git init`) y primer commit del proyecto (`.env` queda excluido por `.gitignore`). Verificar: `git ls-files` no incluye `.env`.
- [ ] 1.2 Crear el `.env` del VPS con valores fuertes: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, credenciales SUMA y `TZ=America/La_Paz`. Verificar: ningún valor de desarrollo (`admin123`, `prm`, placeholder) queda activo.
  - Valores ya generados y `.env.example` creado; el `.env` real se escribe en el VPS (runbook §3.2).

## 2. Ajustes de Docker Compose

- [x] 2.1 Agregar `TZ: ${TZ:-America/La_Paz}` al servicio `db`.
  - Además `command: postgres -c timezone=America/La_Paz` para fijar el timezone del servidor sobre volúmenes existentes (verificado: `show timezone` = `America/La_Paz`).
- [x] 2.2 Quitar el puerto público del `backend` (`3000:3000`) y del `frontend` (`8080:80`).
  - Los puertos de desarrollo se conservan en `docker-compose.dev.yml`.
- [x] 2.3 Parametrizar la contraseña de Postgres desde el entorno (`POSTGRES_PASSWORD` y `PGPASSWORD`).
- [x] 2.4 Agregar el servicio `caddy` (puertos 80/443) con un `Caddyfile` que apunte el dominio al `frontend:80`.
  - Perfil `profiles: ["prod"]`; se activa con `docker compose --profile prod up -d`.

## 3. Migración de datos (Opción A)

- [ ] 3.1 En el origen: `pg_dump -Fc` de `prm` y `tar` de los volúmenes `downloads` y `documentos-despacho`.
- [ ] 3.2 En el VPS: clonar el repo, crear `.env`, `docker compose up -d db`, `pg_restore` del dump, y descomprimir los volúmenes.
- [ ] 3.3 Ejecutar `ALTER USER prm WITH PASSWORD '<POSTGRES_PASSWORD>'` y verificar el conteo de tablas (clientes, tipo_cambio, combustibles, detalles).

## 4. Dominio y TLS

- [ ] 4.1 Apuntar el DNS del dominio (registro A) a la IP del VPS.
- [ ] 4.2 Levantar el stack completo y verificar que Caddy emite el certificado y el sitio responde por HTTPS.

## 5. Verificación

- [ ] 5.1 Entrar por el dominio: login, sección Presentación y Combustibles.
- [ ] 5.2 Verificar que 3000 y 5432 **no** están abiertos al exterior y que el cron queda en `0 15 * * *` (hora Bolivia).
- [ ] 5.3 Nota: programar un backup periódico de la BD (`pg_dump`) — recomendado, fuera del alcance de este cambio.

> Runbook detallado paso a paso: `docs/runbook-migracion-vps.md`.

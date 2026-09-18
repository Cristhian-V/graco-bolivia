-- Cuentas de operador de la aplicación (autenticación y roles).
-- Idempotente: se aplica en cada arranque junto al resto de db/init.

CREATE TABLE IF NOT EXISTS usuarios (
  id            bigserial PRIMARY KEY,
  usuario       text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  rol            text NOT NULL DEFAULT 'presentacion',
  activo         boolean NOT NULL DEFAULT true,
  creado_en     timestamptz NOT NULL DEFAULT now()
);

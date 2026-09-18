-- Esquema inicial del sistema de scraping PRM (idempotente)

CREATE TABLE IF NOT EXISTS clientes (
  nit            text PRIMARY KEY,
  nombre         text NOT NULL,
  activo         boolean NOT NULL DEFAULT true,
  creado_en      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ejecuciones (
  id            bigserial PRIMARY KEY,
  iniciado_en   timestamptz NOT NULL DEFAULT now(),
  finalizado_en timestamptz,
  estado        text NOT NULL DEFAULT 'EN_PROCESO',
  total_prm     integer NOT NULL DEFAULT 0,
  prm_nuevos    integer NOT NULL DEFAULT 0,
  errores       integer NOT NULL DEFAULT 0,
  mensaje       text
);

CREATE TABLE IF NOT EXISTS aduanas (
  codigo_aduana text PRIMARY KEY,
  nombre        text NOT NULL
);

CREATE TABLE IF NOT EXISTS manifiestos (
  id             bigserial PRIMARY KEY,
  num_man        text NOT NULL,
  id_man         text,
  nit            text NOT NULL REFERENCES clientes(nit),
  aduana         text,
  fecha          date,
  correlativo    integer NOT NULL,
  nombre_archivo text,
  ruta_archivo   text,
  run_id         bigint REFERENCES ejecuciones(id),
  creado_en      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (num_man)
);

CREATE INDEX IF NOT EXISTS idx_manifiestos_nit ON manifiestos (nit);

ALTER TABLE manifiestos ADD COLUMN IF NOT EXISTS di text;
ALTER TABLE manifiestos ADD COLUMN IF NOT EXISTS dam text;

CREATE TABLE IF NOT EXISTS combustibles (
  id                      bigserial PRIMARY KEY,
  dim_dam                 text NOT NULL,
  crt                     text,
  uso                     text,
  fecha                   date,
  aduana                  text,
  incoterm                text,
  producto                text,
  proveedor               text,
  importador              text,
  transporte              text,
  cantidad_m3             numeric,
  tipo_cambio_dim         numeric,
  tramo_flete             text,
  us_unitario             numeric,
  importador_nit          text,
  pais_procedencia        text,
  modalidad_despacho      text,
  us_precio_marcador      numeric,
  fecha_factura_trans     date,
  flete_total_usd         numeric,
  flete_total_bs          numeric,
  tipo_cambio_trans       numeric,
  tarifa_flete_usd_m3     numeric,
  nit                     text NOT NULL REFERENCES clientes(nit),
  run_id                  bigint REFERENCES ejecuciones(id),
  raw                     jsonb,
  creado_en               timestamptz NOT NULL DEFAULT now(),
  actualizado_en          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dim_dam)
);

ALTER TABLE combustibles DROP COLUMN IF EXISTS flete_origen_frontera;
ALTER TABLE combustibles DROP COLUMN IF EXISTS tipo_cambio_fof;
ALTER TABLE combustibles DROP COLUMN IF EXISTS flete_frontera_destino;
ALTER TABLE combustibles DROP COLUMN IF EXISTS tipo_cambio_ffd;
ALTER TABLE combustibles DROP COLUMN IF EXISTS total_flete_usd;
ALTER TABLE combustibles DROP COLUMN IF EXISTS lugar_entrega;
ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS fecha_factura_trans date;
ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS flete_total_usd numeric;
ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS flete_total_bs numeric;
ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS tipo_cambio_trans numeric;

CREATE INDEX IF NOT EXISTS idx_combustibles_nit ON combustibles (nit);

CREATE TABLE IF NOT EXISTS documentos_despacho (
  id             bigserial PRIMARY KEY,
  dim_dam        text NOT NULL,
  tipo           text,
  tipo_des       text,
  num            text,
  emi            text,
  nombre_archivo text,
  ruta_archivo   text,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dim_dam, tipo, num)
);

ALTER TABLE documentos_despacho ADD COLUMN IF NOT EXISTS url text;

CREATE TABLE IF NOT EXISTS tipo_cambio (
  fecha         date PRIMARY KEY,
  valor         numeric NOT NULL,
  fuente        text,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proveedores (
  id     bigserial PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS productos (
  id      bigserial PRIMARY KEY,
  nombre  text NOT NULL,
  nandina text,
  UNIQUE (nombre, nandina)
);

CREATE TABLE IF NOT EXISTS paises (
  id          bigserial PRIMARY KEY,
  nombre      text NOT NULL,
  codigo_iso2 text,
  UNIQUE (codigo_iso2)
);

CREATE TABLE IF NOT EXISTS incoterms (
  id          bigserial PRIMARY KEY,
  codigo      text NOT NULL UNIQUE,
  descripcion text
);

CREATE TABLE IF NOT EXISTS transportes (
  id     bigserial PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);

ALTER TABLE aduanas ADD COLUMN IF NOT EXISTS tipo text;
ALTER TABLE aduanas ADD COLUMN IF NOT EXISTS ciudad text;

ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS tarifa_flete_bob_m3 numeric;

ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS tarifa_revisada boolean NOT NULL DEFAULT false;
ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS tarifa_revisada_valor numeric;

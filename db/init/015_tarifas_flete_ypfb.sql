-- Tarifas flete que YPFB negocia con sus proveedores de transporte.
-- Cada carga del Excel crea una fotografía completa identificada por
-- `vigente_desde`; las rutas ausentes se conservan como inactivas.
-- Idempotente: se aplica en cada arranque junto al resto de db/init.

CREATE TABLE IF NOT EXISTS tarifas_flete_ypfb (
  id                 bigserial PRIMARY KEY,
  id_excel           integer,
  lote               text,
  nro_documento      integer,
  pais_origen        text NOT NULL,
  origen             text NOT NULL,
  frontera           text NOT NULL DEFAULT '',
  municipio_frontera text NOT NULL DEFAULT '',
  destino            text NOT NULL,
  municipio_destino  text NOT NULL DEFAULT '',
  tarifa_bob_m3      numeric(14,2) NOT NULL,
  vigente_desde      date NOT NULL,
  activo             boolean NOT NULL DEFAULT true,
  creado_en          timestamptz NOT NULL DEFAULT now(),
  actualizado_en     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tarifas_flete_ypfb_ruta_vigencia
  ON tarifas_flete_ypfb (
    pais_origen, origen, frontera, municipio_frontera, destino, municipio_destino, vigente_desde
  );

CREATE INDEX IF NOT EXISTS idx_tarifas_flete_ypfb_vigencia
  ON tarifas_flete_ypfb (vigente_desde, activo);

CREATE INDEX IF NOT EXISTS idx_tarifas_flete_ypfb_pais
  ON tarifas_flete_ypfb (pais_origen);

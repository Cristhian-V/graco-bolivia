-- Campos de proforma de las importaciones de YPFB (ingresados por el usuario).
-- Idempotente: se aplica en cada arranque junto al resto de db/init.

CREATE TABLE IF NOT EXISTS ypfb_proformas (
  dim_dam         text PRIMARY KEY,
  nro_proforma    text,
  premio          numeric,
  flete           numeric,
  precio_unitario numeric,
  actualizado_en  timestamptz NOT NULL DEFAULT now()
);

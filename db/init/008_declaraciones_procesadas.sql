-- Registro de declaraciones ya procesadas por la extracción de combustibles.
-- Permite que las corridas incrementales omitan tanto las declaraciones de
-- combustible ya extraídas como las que se clasificaron como no-combustible,
-- evitando re-consultarlas en cada corrida.
-- Idempotente: se aplica en cada arranque junto al resto de db/init.

CREATE TABLE IF NOT EXISTS declaraciones_procesadas (
  dim_dam   text PRIMARY KEY,
  estado    text NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- Backfill idempotente desde las declaraciones de combustible ya extraídas.
INSERT INTO declaraciones_procesadas (dim_dam, estado)
SELECT dim_dam, 'COMBUSTIBLE' FROM combustibles
ON CONFLICT (dim_dam) DO NOTHING;

-- Marcadores de referencia de los gráficos de burbujas (por gráfico).
-- Idempotente: se aplica en cada arranque junto al resto de db/init.

CREATE TABLE IF NOT EXISTS marcadores_burbuja (
  id      bigserial PRIMARY KEY,
  grafico text NOT NULL,
  valor   numeric NOT NULL,
  orden   integer NOT NULL DEFAULT 0,
  UNIQUE (grafico, valor)
);

INSERT INTO marcadores_burbuja (grafico, valor, orden) VALUES
  ('empresa', 18, 0),
  ('empresa', 16.5, 1),
  ('ypfb', 18, 0),
  ('ypfb', 16.5, 1)
ON CONFLICT (grafico, valor) DO NOTHING;

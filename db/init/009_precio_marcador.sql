-- Precio marcador de referencia por fecha (USD/m³).
-- `origen` distingue el valor cargado del Excel ('EXCEL') del calculado por
-- relleno de días faltantes ('RELLENO').
-- Idempotente: se aplica en cada arranque junto al resto de db/init.

CREATE TABLE IF NOT EXISTS precio_marcador (
  fecha          date PRIMARY KEY,
  precio         numeric NOT NULL,
  origen         text NOT NULL DEFAULT 'EXCEL',
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

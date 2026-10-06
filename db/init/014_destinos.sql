-- Destinos de transporte agrupados por departamento (para el filtro de la tabla
-- de tarifas de flete). El destino de un tramo se extrae de `tramo_flete` como
-- el texto posterior al último guion (por ejemplo `IQUIQUE - POTOSI` -> `POTOSI`).
-- Idempotente: se aplica en cada arranque junto al resto de db/init.

CREATE TABLE IF NOT EXISTS destinos (
  destino       text PRIMARY KEY,
  departamento  text NOT NULL
);

INSERT INTO destinos (destino, departamento) VALUES
('LA PAZ', 'La Paz'),
('SANTA CRUZ', 'Santa Cruz'),
('POTOSI', 'Potosí'),
('BENI', 'Beni'),
('ORURO', 'Oruro'),
('TARIJA', 'Tarija'),
('COCHABAMBA', 'Cochabamba'),
('PANDO', 'Pando'),
('CHUQUISACA', 'Chuquisaca')
ON CONFLICT (destino) DO NOTHING;

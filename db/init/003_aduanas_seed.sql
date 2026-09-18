-- Catálogo de aduanas (sembrado desde combustibles-28-07-26.xlsx, hoja "aduanas")
INSERT INTO aduanas (codigo_aduana, nombre) VALUES
('241', 'Frontera Desaguadero'),
('421', 'Frontera Pisiga'),
('422', 'Frontera Tambo Quemado'),
('501', 'Interior Potosí'),
('542', 'Frontera Apacheta - Hito Cajones'),
('543', 'Frontera Avaroa'),
('621', 'Frontera Yacuiba'),
('643', 'Frontera Cañada Oruro'),
('701', 'Interior Santa Cruz'),
('721', 'Frontera Puerto Suarez'),
('743', 'Frontera San Vicente')
ON CONFLICT (codigo_aduana) DO NOTHING;

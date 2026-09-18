-- proveedores
INSERT INTO proveedores (nombre) VALUES
('BB ENERGY S.R.L.'),
('COPEC S.A.'),
('CORPORACION PRIMAX S.A.'),
('EMPRESA NACIONAL DE ENERGIA ENEX S.A.'),
('ENERGIGAS S.A.C.'),
('FUELPAR'),
('LATIN OIL SA'),
('MONTE ALEGRE S.A.'),
('MORO SA'),
('PETROPERU S.A.'),
('PLUSPETROL PERU CORPORATION S.A.'),
('TERMINALES Y LOGISTICA PORTUARIA S.A.'),
('TRAFIGURA'),
('TRAFIGURA CHILE LTDA.'),
('TRAFIGURA PTE LTD.'),
('TRAFIGURA SA')
ON CONFLICT (nombre) DO NOTHING;
-- productos
INSERT INTO productos (nombre, nandina) VALUES
('DIESEL', '27101921'),
('GASOLINA 90', '27101220')
ON CONFLICT (nombre, nandina) DO NOTHING;
-- paises
INSERT INTO paises (nombre, codigo_iso2) VALUES
('Argentina', 'AR'),
('Brasil', 'BR'),
('Chile', 'CL'),
('Estados Unidos', 'US'),
('Paraguay', 'PY'),
('Peru', 'PE')
ON CONFLICT (codigo_iso2) DO NOTHING;
-- incoterms
INSERT INTO incoterms (codigo, descripcion) VALUES
('DAP', 'DAP'),
('FCA', 'FCA'),
('FOB', 'FOB')
ON CONFLICT (codigo) DO NOTHING;
-- transportes
INSERT INTO transportes (nombre) VALUES
('ALBATRAIN S.R.L.'),
('CITROEN SRL'),
('COPETRANSTRUCK SRL'),
('DGS OIL LTDA'),
('HIDROALBA SRL'),
('KORY CHUYMA SRL'),
('LIQTHZ S.R.L.'),
('LIQUITRANS S.R.L.'),
('MIKARGO LOGISTICA & TRANSPORTE SRL'),
('MUTEKI TRANSPORT SRL'),
('NIÑO CORIN ALBA S.R.L.'),
('TRANS MALDONADO SRL'),
('TRANS NUEVA GENERACION SRL'),
('TRANS PETRO FLAYER S.R.L.'),
('TRANS ZIBUSHIDO S.R.L.'),
('TRANSPORTES CARMO SRL'),
('TRUCKS LAUREL SRL'),
('TRUCKSPETROL SRL'),
('UNITED TRUCKS S.R.L.')
ON CONFLICT (nombre) DO NOTHING;
-- aduanas (tipo, ciudad, codigo, nombre)
INSERT INTO aduanas (codigo_aduana, nombre, tipo, ciudad) VALUES
('241', 'Frontera Desaguadero', 'Frontera', 'Desaguadero'),
('421', 'Frontera Pisiga', 'Frontera', 'Pisiga'),
('422', 'Frontera Tambo Quemado', 'Frontera', 'Tambo Quemado'),
('501', 'Interior Potosí', 'Interior', 'Potosí'),
('542', 'Frontera Apacheta - Hito Cajones', 'Frontera', 'Apacheta'),
('543', 'Frontera Avaroa', 'Frontera', 'Avaroa'),
('621', 'Frontera Yacuiba', 'Frontera', 'Yacuiba'),
('643', 'Frontera Cañada Oruro', 'Frontera', 'Cañada Oruro'),
('701', 'Interior Santa Cruz', 'Interior', 'Santa Cruz'),
('721', 'Frontera Puerto Suarez', 'Frontera', 'Puerto Suárez'),
('743', 'Frontera San Vicente', 'Frontera', 'Arroyo Concepción')
ON CONFLICT (codigo_aduana) DO UPDATE SET nombre=EXCLUDED.nombre, tipo=EXCLUDED.tipo, ciudad=EXCLUDED.ciudad;

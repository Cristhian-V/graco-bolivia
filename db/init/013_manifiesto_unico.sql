-- Deja un solo manifiesto de carga (TR-007) por declaración.
-- Idempotente: se aplica en cada arranque junto al resto de db/init.

DELETE FROM documentos_despacho
WHERE tipo = 'TR-007'
  AND id NOT IN (
    SELECT min(id) FROM documentos_despacho WHERE tipo = 'TR-007' GROUP BY dim_dam
  );

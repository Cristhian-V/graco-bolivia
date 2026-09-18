-- La tabla `prm` y la vista `resumen_mensual` quedaron huérfanas al retirar la
-- sección y la extracción de PRMs. Se eliminan de forma idempotente.
-- Idempotente: se aplica en cada arranque junto al resto de db/init.

DROP VIEW IF EXISTS resumen_mensual;
DROP TABLE IF EXISTS prm;

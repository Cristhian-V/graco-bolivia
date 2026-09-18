## 1. Corte consciente de huecos

- [x] 1.1 `runService.js` (`scrapeCliente`): calcular `min(fecha)` de `prm` del cliente; cortar al primer existente solo si `minFecha <= desde`. Verificar: YPFB avanza más allá del registro repetido.
- [x] 1.2 `manifiestosService.js` (`processAduana`): ídem con `min(fecha)` de `manifiestos` por `nit` y aduana.

## 2. Verificación

- [x] 2.1 Desplegar el backend.
- [x] 2.2 Relanzar PRMs de YPFB: pasó de 400 a 998 registros y la fecha mínima bajó de 2026-09-16 a 2026-09-14 (sigue avanzando hacia 2026-01-01), 0 errores.

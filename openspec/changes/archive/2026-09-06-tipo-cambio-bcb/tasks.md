## 1. Base de datos

- [x] 1.1 Agregar la tabla `tipo_cambio` (fecha PK, valor, fuente) al esquema idempotente; verificar que el backend la aplica al arrancar y `psql` la lee sin errores.

## 2. Backend — carga y actualización del BCB

- [x] 2.1 Implementar el parser del `cotizacion.xls` (días 1-31 × meses → fecha + valor) y la carga inicial con `ON CONFLICT (fecha) DO UPDATE`; verificar que inserta el histórico de 2026.
- [x] 2.2 Implementar el cliente del endpoint del BCB (`otras_imprimir2XLS.php?qdd=&qmm=&qaa=`) y el parser de la fila `USD`; verificar que para una fecha devuelve el valor correcto (ej. 04/08/2026 → 12.08).
- [x] 2.3 Implementar la actualización por rango de fechas (iterar fechas faltantes y consultar el BCB); verificar que llena las fechas requeridas sin duplicar.

## 3. Backend — aplicación en combustibles

- [x] 3.1 Modificar la extracción/re-proceso de `combustibles` para asignar `tipo_cambio_trans` desde `tipo_cambio[fecha_factura_trans]` y calcular `flete_total_bs`; verificar con un registro real que el TC coincide con el BCB.
- [x] 3.2 Quitar el uso del T/C parseado del PDF en `combustibles` (se conserva `tramo_flete` y la fecha); verificar que ya no se usa el T/C del texto.

## 4. Backend — API REST

- [x] 4.1 Exponer `GET /api/tipo-cambio` (histórico) y `GET /api/tipo-cambio/:fecha`; verificar que devuelven fecha y valor.
- [x] 4.2 Exponer `POST /api/tipo-cambio/actualizar` (rango); verificar que actualiza desde el BCB.

## 5. Frontend React

- [x] 5.1 Agregar la sección "Tipo de cambio" (tabla fecha/valor + botón Actualizar) a la barra lateral; verificar que muestra el histórico.

## 6. Integración y validación

- [x] 6.1 Cargar `cotizacion.xls` y actualizar desde el BCB; verificar que el histórico queda poblado.
- [x] 6.2 Re-procesar `combustibles` y verificar que `tipo_cambio_trans` y `flete_total_bs` coinciden con el BCB (cruzar con la factura de transporte).

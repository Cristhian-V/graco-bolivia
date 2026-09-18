## 1. Esquema de base de datos

- [x] 1.1 Añadir `ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS tarifa_revisada boolean NOT NULL DEFAULT false;` y `ALTER TABLE combustibles ADD COLUMN IF NOT EXISTS tarifa_revisada_valor numeric;` en `db/init/001_schema.sql`. Verificar: al arrancar el backend (`npm start`) el esquema se aplica y `\d combustibles` muestra ambas columnas.

## 2. Backend — edición y marca de revisión

- [x] 2.1 Añadir `PUT /combustibles/:id` en `routes/api.js` con whitelist de columnas editables (todas las de negocio menos `dim_dam`, `id`, `nit`, `run_id` y `raw`), recálculo de derivadas (`tarifa_flete_usd_m3`, `flete_total_bs`, `tarifa_flete_bob_m3`) redondeando a 2 decimales, y replicación a `detalles` vía `upsertDetalle`. Verificar: un `PUT` con `flete_total_usd` o `cantidad_m3` actualiza la fila en `combustibles` y en `detalles`, con la tarifa recalculada.
- [x] 2.2 Añadir `POST /combustibles/:id/ignorar` que guarde `tarifa_revisada = true` y `tarifa_revisada_valor = tarifa_flete_usd_m3`. Verificar: tras llamarlo, el `SELECT` muestra la bandera en true y la marca igual al valor actual (y `null` cuando la tarifa es nula).
- [x] 2.3 Rechazar o ignorar cambios sobre `dim_dam` en el `PUT`. Verificar: enviar `dim_dam` distinto no altera la clave del registro.

## 3. Backend — procesamiento incremental y limpieza

- [x] 3.1 En `runService.js`, detener la paginación de un cliente cuando `upsert` devuelve `is_new === false`. Verificar: una segunda corrida sobre los mismos datos no inserta ni actualiza PRMs previos (`nuevos` queda en 0).
- [x] 3.2 En `manifiestosService.js`, detener la paginación de una aduana al encontrar un `numMan` ya registrado. Verificar: una corrida repetida no reconsulta las páginas de manifiestos antiguos.
- [x] 3.3 En `combustiblesService.js`, omitir los manifiestos cuyo `dim_dam` ya existe en `combustibles`. Verificar: una corrida repetida no re-raspa declaraciones ya extraídas.
- [x] 3.4 Eliminar `reprocesarCombustibles` y `normalizarCombustibles` (funciones, rutas `POST /combustibles/reprocesar` y `POST /combustibles/normalizar`) y sus importaciones. Verificar: esos endpoints responden 404 y no quedan referencias en el código.
- [x] 3.5 Añadir `db/init/008_declaraciones_procesadas.sql` (tabla `declaraciones_procesadas` con backfill desde `combustibles`) y en `combustiblesService.js` saltar/marcar las declaraciones ya procesadas (combustibles y no-combustibles). Verificar: el SQL se aplica idempotente en el arranque y las declaraciones no-combustible no se re-consultan en corridas siguientes.

## 4. Frontend — capa de API

- [x] 4.1 Añadir `putCombustible(id, body)` y `ignorarTarifa(id)` en `frontend/src/api.js` apuntando a los endpoints nuevos. Verificar: el build (`npm run build`) compila sin errores.
- [x] 4.2 Eliminar `normalizarCombustibles` y `reprocesarCombustibles` de `frontend/src/api.js` y sus usos. Verificar: el build compila y no quedan referencias rotas.

## 5. Frontend — tabla de Combustibles

- [x] 5.1 Añadir la clase `.soft-yellow td { background: #fef9c3; }` en `frontend/src/index.css`. Verificar: la clase existe junto a `soft-red`.
- [x] 5.2 Aplicar la lógica de color de fila: rojo suave si `tipo_cambio_trans` es nulo (prevalece); si no, amarillo si `tarifa_flete_usd_m3` es nula o `> 150` y no está revisada. Verificar: filas con tarifa alta o nula se ven amarillas, con tipo de cambio nulo rojas, ambas condiciones rojas, y las revisadas sin amarillo.
- [x] 5.3 Mostrar los documentos en una fila expandida debajo del registro al pulsar "Docs" (subcomponente que llama `getDocumentos`), en lugar del panel al final. Verificar: el clic abre los documentos bajo esa fila y alterna al pulsar de nuevo u otra fila.
- [x] 5.4 Añadir botón "Editar" por fila con formulario expandido para los campos editables (sin `dim_dam`) que guarde con `putCombustible`. Verificar: guardar actualiza la fila y sus derivadas, y el cambio se ve reflejado en la tabla.
- [x] 5.5 Añadir botón "Ignorar" en las filas amarillas que llame a `ignorarTarifa` y refresque la lista. Verificar: quita el amarillo y persiste tras recargar la página; reaparece si el valor cambia.
- [x] 5.6 Quitar los botones "Reprocesar" y "Normalizar" del panel de Combustibles. Verificar: no se muestran en la sección.

## 6. Verificación integral

- [ ] 6.1 Levantar backend y frontend y ejecutar un flujo completo: corrida incremental (no reprocesa existentes), alerta amarilla/roja, Ignorar persistente, Docs inline y edición con reflejo en la sección Presentación. Verificar: los cambios editados se ven en los KPIs/gráficos de Presentación (vía `detalles`).

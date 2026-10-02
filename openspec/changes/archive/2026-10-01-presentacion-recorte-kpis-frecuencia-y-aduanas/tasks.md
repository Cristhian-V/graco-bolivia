## 1. Backend

- [x] 1.1 Agregar el modo `chart=frecuencia` en `getDashboardData` (`backend/src/services/presentacionService.js`) que devuelva `{ monthly_ops, aduana_matrix, aduanas }` usando el mismo `where`; verificar con una llamada a `GET /api/dashboard/data?chart=frecuencia&anio=2026` que llegan las tres claves
- [x] 1.2 Agrupar la aduana nula/vacía bajo `"Sin aduana"` en la consulta de la matriz; verificar que no se pierden operaciones comparando la suma de la matriz con `num_operaciones` del mismo filtro

## 2. Recorte de KPIs y gráfico de CIF

- [x] 2.1 Reducir `kpiList` en `DashboardSection.jsx` a Volumen Total, Nº Operaciones e Importadores; verificar que la sección muestra solo esas tres tarjetas
- [x] 2.2 Cambiar `.dash-kgrid` en `index.css` a 3 columnas / auto-fit; verificar que las tarjetas se acomodan sin celdas vacías en escritorio y en móvil
- [x] 2.3 Eliminar el `ChartCard` "U$S CIF por País de Origen" y ajustar su tercio en `.dash-row`; verificar que el gráfico ya no se renderiza y que los otros dos donuts mantienen su layout

## 3. Gráfico de Frecuencia en líneas múltiples

- [x] 3.1 Reescribir `renderLine`/`d3Line` para dibujar una línea por importador con `scalePoint` de meses transcurridos y `scaleLinear` de operaciones; verificar que se ven líneas separadas y no una sola línea quebrada
- [x] 3.2 Implementar la selección top-N (default 7) y el mapa estable de color procedural por importador; verificar que cambiar N cambia la cantidad de líneas y que el color de un importador no cambia al reordenar el ranking
- [x] 3.3 Agregar la leyenda con el color de cada importador y eliminar las etiquetas de empresa del eje X y los separadores punteados; verificar que los nombres aparecen solo en la leyenda
- [x] 3.4 Agregar el control de cantidad de importadores (default 7, sin "Otros") en la cabecera/filtros de la tarjeta; verificar que subir y bajar el número recalcula el gráfico

## 4. Tabla de Operaciones por Aduana

- [x] 4.1 Crear la tabla con filas = importadores del gráfico y columnas = aduanas presentes en el período; verificar que un cambio de año o de filtro actualiza ambas vistas
- [x] 4.2 Aplicar el mapa de calor por celda proporcional al máximo del período, con celda cero para vacíos; verificar visualmente la gradación y que no hay celdas en blanco por error
- [x] 4.3 Agregar columna de total por importador, fila de totales por aduana y primera columna fija con scroll horizontal; verificar totales y que la columna de importadores queda fija al desplazar

## 5. Interacción y verificación final

- [x] 5.1 Elevar el estado de filtros y de importador resaltado a un contenedor de dos tarjetas conectadas; verificar que gráfico y tabla comparten filtros y período
- [x] 5.2 Implementar el resaltado de la línea al pasar el cursor por la fila de la tabla y por la entrada de la leyenda; verificar el resaltado en ambos sentidos y que se restablece al salir
- [x] 5.3 Verificación integral: abrir Presentación y comprobar KPIs acotados, ausencia del CIF por país, líneas por importador con leyenda y filtro de cantidad, y tabla de aduanas interactiva
- [x] 5.4 Ocultar en la tabla de aduanas las columnas cuyo total entre los importadores mostrados sea cero (verificado visualmente)

## 6. Vista por semanas y selección única de mes

- [x] 6.1 Backend: `chart=frecuencia` devuelve `weekly_ops` (importador → inicio de semana → operaciones) y `semanas` con `date_trunc('week')` y el mismo `where`; verificar que con un mes seleccionado la suma de semanas coincide con las operaciones de ese mes
- [x] 6.2 Frontend: `CardFrame` con `singleMonth` y `buildFrecuenciaModel` que usa `weekly_ops` cuando hay un único mes y `monthly_ops` cuando no hay mes; verificar que el eje X muestra semanas Lun–Dom (`dd Mmm - dd Mmm`) al elegir un mes y meses al quitar la selección
- [x] 6.3 Actualizar spec y design (Filtros y pestañas, requisito de Frecuencia con vista por semanas)

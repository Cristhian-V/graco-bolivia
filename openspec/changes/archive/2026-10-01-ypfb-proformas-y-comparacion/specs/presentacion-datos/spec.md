## MODIFIED Requirements

### Requirement: Panel de visualización

El sistema SHALL presentar una sección con KPIs y gráficos calculados sobre `detalles`: volumen total, número de operaciones e importadores; frecuencia mensual por empresa, benchmarking de precio promedio, market share por proveedor y volumen por procedencia. El sistema SHALL además presentar una tabla semanal de precios ponderados de importación, un gráfico de burbujas por empresa importadora en Bs/litro, una tabla de operaciones por aduana por importador, dos tablas comparativas de tarifa de flete promedio por tramo (en USD/m³ y en Bs/m³), una tabla de volumen por frontera y una comparación de precio unitario por proveedor de diésel de YPFB. El sistema SHALL NOT presentar los KPIs de precio marcador, precio promedio, total U$S CIF, flete total ni tarifa de flete promedio, ni el gráfico de U$S CIF por país de origen, ni el gráfico de burbujas del cliente YPFB.

#### Scenario: Vista del panel
- **WHEN** el usuario abre la sección Presentación
- **THEN** se muestran los KPIs, la tabla semanal, el gráfico de burbujas por empresa, la tabla de operaciones por aduana por importador, las tablas de tarifa de flete por tramo y de volumen por frontera, y la comparación de diésel de YPFB

#### Scenario: KPIs acotados
- **WHEN** el usuario abre la sección Presentación
- **THEN** el panel muestra solo los KPIs de volumen total, número de operaciones e importadores, y no muestra los KPIs de precio marcador, precio promedio, total U$S CIF, flete total ni tarifa de flete promedio

#### Scenario: Sin gráfico de CIF por país
- **WHEN** el usuario abre la sección Presentación
- **THEN** no se presenta el gráfico de U$S CIF por país de origen

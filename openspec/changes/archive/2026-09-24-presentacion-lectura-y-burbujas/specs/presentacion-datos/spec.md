## MODIFIED Requirements

### Requirement: Gráfico de burbujas por empresa importadora

El sistema SHALL presentar, a ancho completo de la pantalla, un gráfico de burbujas donde el eje X es la empresa importadora, el eje Y es el precio promedio de importación en Bs/litro, cada burbuja representa una empresa, el tamaño de la burbuja es fijo y aplanado, y el volumen importado se muestra como número sobre cada burbuja.

#### Scenario: Ejes y tamaño de burbuja
- **WHEN** se muestra el gráfico de burbujas
- **THEN** el eje X es la empresa importadora, el eje Y es el precio ponderado en Bs/litro, cada burbuja tiene tamaño fijo aplanado (50% de alto) y muestra su volumen como número encima

#### Scenario: Líneas horizontales de referencia
- **WHEN** se muestra el gráfico de burbujas
- **THEN** se dibujan los marcadores de referencia configurados para ese gráfico

#### Scenario: Ancho completo
- **WHEN** se muestran los gráficos de burbujas
- **THEN** cada uno ocupa el ancho completo y se apilan en filas separadas

### Requirement: Gráfico de burbujas del cliente YPFB

El sistema SHALL presentar, a ancho completo de la pantalla, un gráfico de burbujas con los mismos ejes, presentación aplanada, volumen visible y marcadores configurables del gráfico por empresa importadora, pero limitado a los registros del cliente YPFB.

#### Scenario: Datos de YPFB
- **WHEN** se muestra el gráfico de YPFB
- **THEN** solo se incluyen los registros cuyo importador corresponde al cliente YPFB

#### Scenario: Sin registros de YPFB
- **WHEN** el cliente YPFB no tiene registros en `detalles`
- **THEN** el gráfico se muestra sin burbujas, conservando los marcadores de referencia

## ADDED Requirements

### Requirement: Marcadores de referencia configurables

El sistema SHALL permitir configurar, de forma independiente para cada gráfico de burbujas, una cantidad arbitraria de marcadores de referencia con el valor que el usuario indique, y SHALL persistirlos en la base de datos al pulsar Aplicar.

#### Scenario: Agregar y quitar marcadores
- **WHEN** el usuario agrega o quita marcadores y les asigna un valor
- **THEN** puede definir cuántos marcadores quiere y el valor de cada uno

#### Scenario: Persistencia
- **WHEN** el usuario pulsa Aplicar
- **THEN** los marcadores vigentes se guardan en la base de datos y los que se quitaron se eliminan, de modo que se conservan al recargar

#### Scenario: Marcadores por gráfico
- **WHEN** el usuario cambia los marcadores de un gráfico
- **THEN** los del otro gráfico de burbujas no se ven afectados

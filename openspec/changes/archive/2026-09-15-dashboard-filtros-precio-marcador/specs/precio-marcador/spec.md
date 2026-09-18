## Purpose

Gestiona el precio marcador de referencia en USD/m³: carga desde un Excel, completado de los días sin dato y aplicación a las tablas de combustibles y de presentación.

## ADDED Requirements

### Requirement: Carga y revisión del precio marcador desde Excel

El sistema SHALL leer un archivo Excel (`.xlsx` o `.xls`) con una hoja llamada `Precio Marcador` con columnas `fecha` y `precio`, SHALL mostrar los registros leídos en una vista previa sin modificar la base de datos, y SHALL guardarlos en la tabla `precio_marcador` deduplicando por `fecha` recién cuando el usuario confirma el procesamiento.

#### Scenario: Lectura para vista previa
- **WHEN** el usuario sube un Excel con la hoja `Precio Marcador`
- **THEN** se muestran los pares `fecha`/`precio` leídos en una vista previa, sin escribir todavía en `precio_marcador`

#### Scenario: Archivo .xls
- **WHEN** el usuario sube un archivo `.xls` (formato antiguo)
- **THEN** se lee igual que un `.xlsx` y se muestra la vista previa

#### Scenario: Confirmación del procesamiento
- **WHEN** el usuario revisa la vista previa y confirma el procesamiento
- **THEN** cada par `fecha`/`precio` se guarda en `precio_marcador`

#### Scenario: Re-procesamiento del archivo
- **WHEN** se procesa un archivo con una fecha ya registrada
- **THEN** su `precio` se actualiza sin duplicar la fecha

#### Scenario: Archivo sin la hoja esperada
- **WHEN** el archivo no contiene la hoja `Precio Marcador`
- **THEN** la lectura falla con un aviso y no se modifica ningún registro

### Requirement: Historial del precio marcador

El sistema SHALL presentar una pestaña de historial con las fechas y precios ya cargados en `precio_marcador`, indicando su origen.

#### Scenario: Consulta del historial
- **WHEN** el usuario abre la pestaña de historial
- **THEN** se listan las fechas y precios almacenados en `precio_marcador` con su origen

### Requirement: Relleno de días faltantes

El sistema SHALL completar todas las fechas faltantes dentro del rango comprendido entre la fecha mínima y la fecha máxima cargadas, calculando el precio de cada fecha faltante como el promedio de los 3 registros anteriores y los 3 posteriores más cercanos.

#### Scenario: Día sin dato
- **WHEN** falta una fecha dentro del rango cargado (por ejemplo un sábado, domingo o feriado)
- **THEN** se registra esa fecha con el promedio de los 3 precios anteriores y los 3 posteriores más cercanos

#### Scenario: Borde sin suficientes vecinos
- **WHEN** una fecha faltante está cerca del inicio o del final del rango y no existen 3 registros de un lado
- **THEN** se promedian los registros disponibles a ambos lados

#### Scenario: Recálculo del relleno
- **WHEN** se vuelve a ejecutar el relleno
- **THEN** los valores rellenados previamente se descartan y se recalculan a partir de los registros cargados del archivo

### Requirement: Aplicación del precio marcador a combustibles y detalles

El sistema SHALL actualizar `us_precio_marcador` en las tablas `combustibles` y `detalles` según la `fecha`, usando el precio marcador registrado para esa fecha, y SHALL dejar intactas las filas cuya fecha no tenga precio marcador.

#### Scenario: Actualización por fecha
- **WHEN** el usuario aplica el precio marcador
- **THEN** cada fila de `combustibles` y de `detalles` con fecha coincidente toma el precio marcador de esa fecha

#### Scenario: Fila sin coincidencia
- **WHEN** una fila no tiene un precio marcador para su fecha
- **THEN** su `us_precio_marcador` no se modifica

### Requirement: Sección Precio Marcador

El sistema SHALL presentar una sección con dos pestañas, una de carga con vista previa y otra de historial, y con las acciones de subir el archivo, rellenar los días faltantes y aplicar el precio marcador, visible para los roles `admin` y `presentacion`.

#### Scenario: Vista previa antes de sincronizar
- **WHEN** el usuario sube el archivo en la pestaña de carga
- **THEN** los registros se muestran en esa pestaña para revisarlos antes de procesarlos y sincronizarlos

#### Scenario: Historial de subidas
- **WHEN** el usuario cambia a la pestaña de historial
- **THEN** se muestran las fechas subidas hasta el momento

#### Scenario: Visibilidad por rol
- **WHEN** un usuario con rol `admin` o `presentacion` inicia sesión
- **THEN** puede acceder a la sección Precio Marcador

#### Scenario: Flujo por botones
- **WHEN** el usuario procesa el archivo, rellena los faltantes y aplica el marcador
- **THEN** cada acción se ejecuta de forma independiente y reporta su resultado

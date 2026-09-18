## Purpose

Descarga los PDFs de los manifiestos (MIC/DTA) asociados a los PRMs de cada cliente desde SUMA, con deduplicación por número de manifiesto, guardado en carpeta del backend y programación semanal.

## ADDED Requirements

### Requirement: Búsqueda de manifiestos por cliente y aduana

El sistema SHALL buscar los PRMs de un cliente en la sección "Agrupación de PRM's" de SUMA usando el NIT del importador (campo consignatario) y el código de aduana de recepción, y SHALL paginar los resultados hasta agotarlos.

#### Scenario: Búsqueda con resultados
- **WHEN** se consulta el endpoint `criBus` con `numDocCos` igual al NIT del importador y `aduRec` igual al código de aduana de recepción
- **THEN** el sistema obtiene la lista de PRMs con su manifiesto asociado (`datGen.numMan` e `datGen.idMan`)

#### Scenario: Cliente sin manifiestos
- **WHEN** un cliente no tiene resultados para una aduana
- **THEN** el sistema continúa con la siguiente aduana o cliente sin error

### Requirement: Obtención de las aduanas por cliente

El sistema SHALL obtener los códigos de aduana de recepción que usa cada cliente a partir de los PRMs ya almacenados en la sección de PRMs.

#### Scenario: Aduanas derivadas de los PRMs
- **WHEN** se prepara la corrida de manifiestos para un cliente
- **THEN** se consultan los códigos de aduana de recepción distintos presentes en sus PRMs y se itera sobre cada uno

### Requirement: Descarga del PDF del manifiesto

El sistema SHALL descargar un único PDF por manifiesto, equivalente a la acción "Ver Manifiesto" del portal SUMA.

#### Scenario: Manifiesto con documento firmado
- **WHEN** el detalle del manifiesto tiene documentos firmados (`infTec.docFir`)
- **THEN** se descarga el PDF del último documento firmado

#### Scenario: Manifiesto sin documento firmado
- **WHEN** el detalle del manifiesto no tiene documentos firmados pero sí documentos soporte (`docSopMic`) de tipo MIC/DTA
- **THEN** se descarga el PDF del documento soporte correspondiente

#### Scenario: Manifiesto sin PDF disponible
- **WHEN** el manifiesto no tiene ningún PDF descargable
- **THEN** se registra el caso y se continúa sin descargar

### Requirement: Filtro por rango de fechas

El sistema SHALL filtrar los PRMs devueltos por la búsqueda por el campo `fecTra`, conservando únicamente los del rango configurado (primera carga julio en adelante; corridas semanales el mes en curso).

#### Scenario: Filtro de la corrida semanal
- **WHEN** la corrida es semanal
- **THEN** se conservan los manifiestos cuyos PRMs tienen `fecTra` dentro del mes en curso

#### Scenario: Primera carga
- **WHEN** la corrida es la primera carga (backfill)
- **THEN** se conservan los manifiestos cuyos PRMs tienen `fecTra` desde la fecha inicial configurada (por defecto 2026-07-01)

### Requirement: Deduplicación por número de manifiesto

El sistema SHALL descargar cada manifiesto una única vez, usando el número de manifiesto (`numMan`) como clave, y SHALL omitir los ya descargados.

#### Scenario: Manifiesto nuevo
- **WHEN** aparece un manifiesto cuyo `numMan` no está registrado
- **THEN** se descarga su PDF y se registra

#### Scenario: Manifiesto ya descargado
- **WHEN** aparece un manifiesto cuyo `numMan` ya está registrado
- **THEN** se omite su descarga

### Requirement: Almacenamiento de archivos

El sistema SHALL guardar cada PDF en una carpeta del backend con un nombre compuesto por el nombre del cliente y un número correlativo por cliente.

#### Scenario: Guardado del PDF
- **WHEN** se descarga el PDF de un manifiesto de un cliente
- **THEN** se guarda en la carpeta de descargas con el nombre `{nombre_cliente}_{correlativo}.pdf`, donde el correlativo se incrementa por cliente

### Requirement: Programación semanal

El sistema SHALL ejecutar la descarga de manifiestos automáticamente cada sábado, después de que termine la corrida de PRMs.

#### Scenario: Disparo tras la corrida de PRMs
- **WHEN** la corrida semanal de PRMs finaliza
- **THEN** se dispara la corrida de manifiestos que consulta el mes en curso

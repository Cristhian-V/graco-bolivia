# manifiestos Specification

## Purpose

Descarga los PDFs de los manifiestos (MIC/DTA) asociados a los PRMs de cada cliente desde SUMA, con deduplicación por número de manifiesto, guardado en carpeta del backend y programación diaria.

## Requirements

### Requirement: Búsqueda de manifiestos por cliente y aduana

El sistema SHALL buscar los PRMs de un cliente en la sección "Agrupación de PRM's" de SUMA usando el NIT del importador (campo consignatario) **sin acotar la aduana de recepción**, y SHALL paginar los resultados hasta agotarlos.

#### Scenario: Búsqueda con resultados
- **WHEN** se consulta el endpoint `criBus` con `numDocCos` igual al NIT del importador y sin aduana de recepción
- **THEN** se obtienen los PRMs de todas las aduanas del cliente con su manifiesto asociado (`datGen.numMan` e `datGen.idMan`) y su aduana (`datGen.aduRec.cod`)

#### Scenario: Cliente sin manifiestos
- **WHEN** un cliente no tiene resultados
- **THEN** el sistema continúa con el siguiente cliente sin error

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

El sistema SHALL filtrar los PRMs devueltos por la búsqueda por el campo `fecTra`, conservando únicamente los del rango configurado (primera carga desde enero 2026 en adelante; corridas diarias el mes en curso).

#### Scenario: Filtro de la corrida diaria
- **WHEN** la corrida es diaria
- **THEN** se conservan los manifiestos cuyos PRMs tienen `fecTra` dentro del mes en curso

#### Scenario: Primera carga
- **WHEN** la corrida es la primera carga (backfill)
- **THEN** se conservan los manifiestos cuyos PRMs tienen `fecTra` desde la fecha inicial configurada (por defecto 2026-01-01)

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

### Requirement: Delimitación por tipo de embalaje

El sistema SHALL descargar únicamente los manifiestos cuyos PRMs tienen al menos un ítem con tipo de embalaje de código `VL` y descripción `LIQUIDO A GRANEL`.

#### Scenario: Manifiesto de combustible
- **WHEN** un manifiesto tiene un ítem con tipo de embalaje `VL` / `LIQUIDO A GRANEL`
- **THEN** el manifiesto se descarga

#### Scenario: Manifiesto que no es de combustible
- **WHEN** un manifiesto no tiene ningún ítem con tipo de embalaje `VL` / `LIQUIDO A GRANEL`
- **THEN** el manifiesto se omite

### Requirement: Procesamiento incremental de manifiestos

El sistema SHALL detener la búsqueda de manifiestos de un cliente al primer manifiesto ya descargado para no reconsultar los existentes, siempre que los manifiestos guardados de ese cliente y aduana lleguen hasta la fecha inicial `desde` (sin huecos). Si el manifiesto guardado más antiguo es posterior a `desde`, el sistema SHALL recorrer el rango de fechas completo sin cortar por manifiestos existentes, para llenar el hueco.

#### Scenario: Manifiesto ya descargado
- **WHEN** durante la paginación se encuentra un manifiesto cuyo `numMan` ya está registrado y los manifiestos guardados de la aduana llegan hasta `desde`
- **THEN** se detiene la paginación de esa aduana

#### Scenario: Aduana sin manifiestos previos
- **WHEN** la aduana no tiene manifiestos descargados previamente
- **THEN** se procesa el rango de fechas completo

#### Scenario: Hueco de manifiestos
- **WHEN** el manifiesto guardado más antiguo de la aduana es posterior a `desde`
- **THEN** no se corta por encontrar manifiestos existentes y se recorre la paginación hasta `desde` para completar el hueco

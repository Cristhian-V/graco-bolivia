## Purpose

Persiste los PRMs extraídos en PostgreSQL con deduplicación por clave de negocio, registra las ejecuciones y programa la corrida semanal.

## ADDED Requirements

### Requirement: Persistencia con deduplicación

El sistema SHALL almacenar cada PRM en la tabla `prm` y SHALL usar la combinación `prm + dam + di` como clave única para evitar duplicados entre corridas (upsert).

#### Scenario: Registro nuevo
- **WHEN** llega un PRM cuya combinación `prm + dam + di` no existe
- **THEN** se inserta un registro nuevo

#### Scenario: Registro ya existente
- **WHEN** llega un PRM cuya combinación `prm + dam + di` ya existe
- **THEN** se actualiza el registro existente sin crear duplicados

#### Scenario: DAM o DI ausentes
- **WHEN** un PRM no trae `dam` o `di`
- **THEN** el registro se almacena con ese campo nulo y la unicidad se evalúa sobre los campos presentes

### Requirement: Catálogo de clientes

El sistema SHALL mantener una tabla `clientes` con el NIT y nombre de cada cliente, y SHALL iterar la extracción sobre los NITs de esa tabla.

#### Scenario: Alta de cliente
- **WHEN** se registra un cliente con su NIT y nombre
- **THEN** el cliente queda disponible para la extracción semanal

### Requirement: Registro de ejecuciones

El sistema SHALL registrar cada corrida en la tabla `ejecuciones` con inicio, fin, estado, total de PRMs, PRMs nuevos y errores.

#### Scenario: Corrida exitosa
- **WHEN** una corrida termina sin errores
- **THEN** se registra con estado `OK` y los contadores correspondientes

#### Scenario: Corrida con fallos
- **WHEN** una corrida termina con errores en algunos clientes
- **THEN** se registra el estado y los contadores de errores para su revisión

### Requirement: Programación semanal

El sistema SHALL ejecutar la extracción automáticamente cada sábado.

#### Scenario: Disparo semanal
- **WHEN** llega el horario programado del sábado
- **THEN** se dispara una corrida que consulta el mes en curso para todos los clientes activos

### Requirement: Exposición de datos vía API

El backend SHALL exponer los datos almacenados a través de una API HTTP que permita consultar los registros de un cliente, el resumen mensual y el histórico.

#### Scenario: Registros de un cliente
- **WHEN** se consulta la API con el NIT de un cliente
- **THEN** se devuelven sus PRMs con sus campos (prm, dam, di, fecha, estado, etc.)

#### Scenario: Resumen mensual
- **WHEN** se consulta el resumen de un mes
- **THEN** se devuelve el número de PRMs por cliente para ese mes

#### Scenario: Histórico
- **WHEN** se consulta el histórico
- **THEN** se devuelve el número de PRMs por cliente y por mes para todos los meses disponibles

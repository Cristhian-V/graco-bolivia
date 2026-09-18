## Purpose

Interfaz web React para consultar los PRMs descargados por cliente, ver el resumen mensual y el histórico acumulado de todos los meses.

## ADDED Requirements

### Requirement: Tabla de registros por cliente

El frontend SHALL mostrar los PRMs de cada cliente en una tabla con sus campos principales (PRM, DAM, DI, fecha, estado, etc.).

#### Scenario: Ver registros de un cliente
- **WHEN** el usuario selecciona un cliente
- **THEN** se muestra una tabla con los PRMs de ese cliente

#### Scenario: Sin registros
- **WHEN** el cliente seleccionado no tiene PRMs
- **THEN** se muestra un mensaje indicando que no hay datos

### Requirement: Resumen mensual

El frontend SHALL mostrar un resumen del número de PRMs por cliente para el mes en curso.

#### Scenario: Resumen del mes
- **WHEN** el usuario abre la vista de resumen
- **THEN** se muestra cuántos PRMs tiene cada cliente en el mes en curso

### Requirement: Histórico de todos los meses

El frontend SHALL mostrar un histórico con el número de PRMs por cliente y por mes para todos los meses disponibles.

#### Scenario: Vista histórica
- **WHEN** el usuario abre la vista histórica
- **THEN** se muestra la cantidad de PRMs por cliente agrupada por mes, incluyendo meses pasados

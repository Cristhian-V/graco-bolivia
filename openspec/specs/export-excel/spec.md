# export-excel Specification

## Purpose

Exporta los datos a un archivo Excel con las ocho hojas del modelo de referencia, en el orden definido, con un filtro de mes y año para la hoja de detalles.

## Requirements

### Requirement: Exportación con las ocho hojas

El sistema SHALL exportar un archivo Excel con las hojas `clientes`, `proveedores`, `productos`, `aduanas`, `paises`, `incoterms`, `transportes` y `detalles`, en el orden definido en el archivo `combustibles_export.xlsx`.

#### Scenario: Descarga del Excel
- **WHEN** el usuario solicita la descarga
- **THEN** se genera un archivo Excel con las ocho hojas en el orden del modelo

#### Scenario: Hoja de detalles
- **WHEN** se genera la hoja `detalles`
- **THEN** sus columnas siguen el orden del modelo y finalizan con `tarifa_flete_usd_m3` y `tarifa_flete_bob_m3`

### Requirement: Filtro por mes y año

El sistema SHALL permitir seleccionar un mes y año para la descarga, aplicando el filtro únicamente a la hoja `detalles`.

#### Scenario: Descarga de un mes específico
- **WHEN** el usuario selecciona un mes y año
- **THEN** la hoja `detalles` contiene solo los registros con `fecha` en ese mes; las hojas de referencia se descargan completas

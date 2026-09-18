## ADDED Requirements

### Requirement: Navegación por secciones

El frontend SHALL organizar su contenido en secciones accesibles desde una barra lateral, de modo que puedan irse añadiendo nuevas secciones.

#### Scenario: Acceso a una sección
- **WHEN** el usuario selecciona una sección en la barra lateral
- **THEN** se muestra el contenido correspondiente a esa sección

### Requirement: Sección de Aduanas

El frontend SHALL mostrar una sección con la tabla de aduanas (código y nombre) y SHALL permitir dar de alta nuevos registros de aduana.

#### Scenario: Listado de aduanas
- **WHEN** el usuario abre la sección de Aduanas
- **THEN** se muestra una tabla con el código y el nombre de cada aduana

#### Scenario: Alta de aduana
- **WHEN** el usuario ingresa el código y el nombre de una nueva aduana y confirma
- **THEN** el registro se crea y aparece en la tabla

### Requirement: Sección de Manifiestos

El frontend SHALL mostrar una sección con los manifiestos descargados de cada cliente y SHALL permitir abrir el PDF de cada uno.

#### Scenario: Listado de manifiestos
- **WHEN** el usuario abre la sección de Manifiestos y selecciona un cliente
- **THEN** se muestra la lista de manifiestos descargados para ese cliente

#### Scenario: Abrir PDF
- **WHEN** el usuario pulsa sobre un manifiesto
- **THEN** se abre el PDF descargado

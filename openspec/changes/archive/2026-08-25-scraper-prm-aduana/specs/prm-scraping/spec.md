## Purpose

Extrae Partes de Recepción de Mercancías (PRM) del portal SUMA de la Aduana Nacional autenticándose por API y consultando por NIT de cliente.

## ADDED Requirements

### Requirement: Autenticación en SUMA

El sistema SHALL autenticarse contra el SSO de SUMA usando las credenciales del archivo `.env` (usuario y contraseña) con tipo de usuario `EXTERNO` y operador `ip`, y SHALL obtener un token de sesión válido.

#### Scenario: Login exitoso
- **WHEN** el sistema envía usuario y contraseña válidos al endpoint `autenticar/portal?operador=ip`
- **THEN** recibe `success: true` junto con un `token` (UUID) y un `jwt`

#### Scenario: Credenciales inválidas
- **WHEN** el usuario o la contraseña son incorrectos
- **THEN** el sistema recibe `success: false` y registra el error sin continuar la extracción

#### Scenario: Token expirado
- **WHEN** una llamada de extracción responde con estado 401 (sesión expirada)
- **THEN** el sistema vuelve a autenticarse y reintenta la llamada

### Requirement: Consulta de PRMs por NIT

El sistema SHALL consultar los Partes de Recepción de Mercancías de un cliente usando su NIT y SHALL paginar los resultados hasta agotarlos.

#### Scenario: Búsqueda con resultados
- **WHEN** se consulta el endpoint `getParteRecepcionByNumPrmAndImpAndDe` con el `dst.numDoc` igual al NIT del cliente
- **THEN** el sistema obtiene la lista de PRMs y el total vía `countParteRecepcionByNumPrmAndImpAndDe`

#### Scenario: Cliente sin PRMs
- **WHEN** un NIT no tiene resultados
- **THEN** el sistema registra cero registros para ese cliente y continúa con el siguiente

### Requirement: Filtro por rango de fechas

El sistema SHALL filtrar los PRMs devueltos por la API por el campo `fecTra`, conservando únicamente los registros dentro de un rango de fechas configurable (`desde` y `hasta`).

#### Scenario: Filtro del mes en curso
- **WHEN** la corrida es semanal
- **THEN** se conservan únicamente los PRMs con `fecTra` entre el primer día del mes en curso y el día de la corrida

#### Scenario: Backfill desde fecha inicial
- **WHEN** la corrida es un backfill inicial
- **THEN** se conservan los PRMs con `fecTra` desde la fecha inicial configurada (por defecto 2026-07-01) hasta la fecha de la corrida

### Requirement: Robustez y cadencia de peticiones

El sistema SHALL aplicar esperas entre peticiones a la API para evitar bloqueos por volumen y SHALL reintentar de forma acotada ante errores transitorios.

#### Scenario: Error transitorio
- **WHEN** una petición falla por un error de red o 5xx
- **THEN** el sistema reintenta con espera y, si sigue fallando, registra el error y continúa con el siguiente cliente

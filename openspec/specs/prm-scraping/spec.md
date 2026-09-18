# prm-scraping Specification

## Purpose

Autenticación en el portal SUMA de la Aduana Nacional y robustez de las peticiones a su API. La extracción de PRMs fue retirada; estos requisitos son compartidos por los scrapers de manifiestos y combustibles.

## Requirements

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

### Requirement: Robustez y cadencia de peticiones

El sistema SHALL aplicar esperas entre peticiones a la API para evitar bloqueos por volumen, SHALL usar un timeout de petición amplio y configurable para tolerar clientes con historiales grandes, y SHALL reintentar de forma acotada ante errores transitorios.

#### Scenario: Error transitorio
- **WHEN** una petición falla por un error de red o 5xx
- **THEN** el sistema reintenta con espera y, si sigue fallando, registra el error y continúa con el siguiente cliente

#### Scenario: Cliente con historial grande
- **WHEN** una petición de PRMs tarda más que un timeout corto pero responde dentro del timeout configurado
- **THEN** la petición se completa y la corrida continúa

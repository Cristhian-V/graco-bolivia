## MODIFIED Requirements

### Requirement: Robustez y cadencia de peticiones

El sistema SHALL aplicar esperas entre peticiones a la API para evitar bloqueos por volumen, SHALL usar un timeout de petición amplio y configurable para tolerar clientes con historiales grandes, y SHALL reintentar de forma acotada ante errores transitorios.

#### Scenario: Error transitorio
- **WHEN** una petición falla por un error de red o 5xx
- **THEN** el sistema reintenta con espera y, si sigue fallando, registra el error y continúa con el siguiente cliente

#### Scenario: Cliente con historial grande
- **WHEN** una petición de PRMs tarda más que un timeout corto pero responde dentro del timeout configurado
- **THEN** la petición se completa y la corrida continúa

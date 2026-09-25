# despliegue Specification

## Purpose

Define la operación de la aplicación en el VPS: horario de Bolivia, publicación por dominio con HTTPS, servicios internos no expuestos y secretos provistos por el entorno.

## Requirements

### Requirement: Horario de Bolivia

El sistema SHALL operar en la zona horaria `America/La_Paz` en sus contenedores, de modo que la fecha y hora del proceso y de la base de datos sean de Bolivia.

#### Scenario: Contenedores en hora de Bolivia
- **WHEN** se levantan los servicios
- **THEN** el backend y la base de datos usan `TZ=America/La_Paz`

#### Scenario: Corrida diaria en hora local
- **WHEN** se ejecuta la corrida automática
- **THEN** se dispara a las 15:00 de Bolivia

### Requirement: Publicación por dominio con HTTPS

El sistema SHALL publicarse en el dominio configurado a través de un reverse proxy que gestione el certificado TLS, sirviendo la interfaz por HTTPS.

#### Scenario: Acceso por el dominio
- **WHEN** el usuario entra al dominio configurado
- **THEN** se sirve la interfaz por HTTPS con un certificado válido

#### Scenario: API a través del mismo dominio
- **WHEN** la interfaz llama a la API
- **THEN** se enruta por el mismo dominio (mismo origen) hacia el backend

### Requirement: Servicios internos no expuestos

El sistema SHALL exponer públicamente únicamente el reverse proxy (puertos 80 y 443); el backend y la base de datos NO SHALL ser accesibles desde el exterior.

#### Scenario: Backend sin puerto público
- **WHEN** se levanta el stack
- **THEN** el backend no publica su puerto en el host y solo es alcanzable por la red interna de Docker

#### Scenario: Base de datos interna
- **WHEN** se levanta el stack
- **THEN** la base de datos no publica su puerto en el host

### Requirement: Secretos por entorno

El sistema SHALL obtener `JWT_SECRET`, `ADMIN_PASSWORD` y la contraseña de PostgreSQL desde variables de entorno (`.env`), con valores fuertes, y no SHALL tener credenciales fijas de desarrollo en el compose.

#### Scenario: Secretos desde el entorno
- **WHEN** se levanta el stack con un `.env` provisto
- **THEN** el backend y la base de datos usan esos valores

#### Scenario: Sin valores por defecto débiles
- **WHEN** falta un secreto requerido
- **THEN** el arranque falla o no se usan credenciales por defecto conocidas

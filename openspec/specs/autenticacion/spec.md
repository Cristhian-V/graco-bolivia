# autenticacion Specification

## Purpose

Controla el acceso a la aplicación mediante cuentas de operador con roles `admin` y `presentacion`, autenticando con usuario y contraseña y limitando lo que cada rol puede ver y hacer.

## Requirements

### Requirement: Cuentas de usuario

El sistema SHALL mantener una tabla `usuarios` con `usuario` (único), `password_hash`, `rol` (`admin` o `presentacion`), `activo` y fecha de creación.

#### Scenario: Cuenta por defecto
- **WHEN** el sistema arranca y no existe la cuenta `admin`
- **THEN** se crea la cuenta `admin` con la contraseña configurada en `ADMIN_PASSWORD`

#### Scenario: Cuenta desactivada
- **WHEN** una cuenta tiene `activo` en falso
- **THEN** no puede iniciar sesión

### Requirement: Inicio de sesión

El sistema SHALL autenticar a un usuario con su contraseña y, si las credenciales son válidas y la cuenta está activa, SHALL emitir un JWT en una cookie httpOnly.

#### Scenario: Credenciales válidas
- **WHEN** el usuario ingresa usuario y contraseña correctos
- **THEN** el sistema responde con la sesión iniciada y una cookie httpOnly con el JWT

#### Scenario: Credenciales inválidas
- **WHEN** el usuario ingresa usuario o contraseña incorrectos
- **THEN** el sistema rechaza el acceso sin emitir cookie

### Requirement: Sesión actual y cierre de sesión

El sistema SHALL permitir consultar la sesión actual y cerrarla.

#### Scenario: Consulta de sesión
- **WHEN** un usuario autenticado consulta su sesión
- **THEN** el sistema responde con su usuario y rol

#### Scenario: Cierre de sesión
- **WHEN** el usuario cierra sesión
- **THEN** la cookie de sesión se invalida y el acceso queda bloqueado

### Requirement: Control de acceso por rol

El sistema SHALL exigir sesión válida para toda la API y SHALL limitar al rol `presentacion` a los endpoints de autenticación y del panel (`/api/auth/*` y `/api/dashboard/*`); el resto de la API SHALL requerir rol `admin`.

#### Scenario: Sin sesión
- **WHEN** una petición llega sin cookie de sesión válida
- **THEN** el sistema responde con error de no autenticado

#### Scenario: Usuario de presentación fuera de su alcance
- **WHEN** un usuario con rol `presentacion` accede a un endpoint que no es de autenticación ni del panel
- **THEN** el sistema responde con error de acceso denegado

#### Scenario: Administrador con acceso total
- **WHEN** un usuario con rol `admin` accede a cualquier endpoint
- **THEN** el sistema permite el acceso

### Requirement: Gestión de cuentas por el administrador

El sistema SHALL permitir al rol `admin` listar, crear y editar cuentas (usuario, contraseña, rol y estado `activo`), sin eliminarlas.

#### Scenario: Crear una cuenta
- **WHEN** el administrador crea una cuenta con usuario, contraseña y rol
- **THEN** la cuenta queda registrada y puede iniciar sesión

#### Scenario: Editar una cuenta
- **WHEN** el administrador edita una cuenta (propia o de otro)
- **THEN** los cambios de usuario, contraseña, rol o `activo` se guardan

#### Scenario: Desactivar una cuenta
- **WHEN** el administrador desactiva una cuenta
- **THEN** la cuenta deja de poder iniciar sesión sin ser eliminada

### Requirement: Acceso por rol en la interfaz

El sistema SHALL mostrar las secciones de la interfaz según el rol: `admin` ve todas las secciones y la sección Usuarios; `presentacion` ve solo la sección Presentación.

#### Scenario: Usuario de presentación
- **WHEN** un usuario con rol `presentacion` entra a la aplicación
- **THEN** ve únicamente la sección Presentación, y puede usar sus filtros y pestañas

#### Scenario: Administrador
- **WHEN** un usuario con rol `admin` entra a la aplicación
- **THEN** ve todas las secciones y la sección Usuarios

#### Scenario: Sin sesión
- **WHEN** la aplicación no tiene sesión iniciada
- **THEN** muestra la pantalla de inicio de sesión y no las secciones

### Requirement: Contraseñas seguras

El sistema SHALL almacenar las contraseñas solo como hash (nunca en texto plano) con un salt por contraseña.

#### Scenario: Almacenamiento de la contraseña
- **WHEN** se crea o actualiza la contraseña de una cuenta
- **THEN** se guarda un hash con salt, no la contraseña en texto plano

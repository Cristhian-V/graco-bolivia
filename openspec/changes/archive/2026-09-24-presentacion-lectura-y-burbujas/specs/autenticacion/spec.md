## MODIFIED Requirements

### Requirement: Control de acceso por rol

El sistema SHALL exigir sesión válida para toda la API. El rol `presentacion` SHALL tener acceso de solo lectura (`GET`) a los endpoints de autenticación, del panel, de manifiestos, de combustibles, de tipo de cambio y de precio marcador, además de la lista de clientes; cualquier escritura (`POST`/`PUT`) y el resto de la API SHALL requerir rol `admin`.

#### Scenario: Sin sesión
- **WHEN** una petición llega sin cookie de sesión válida
- **THEN** el sistema responde con error de no autenticado

#### Scenario: Usuario de presentación fuera de su alcance
- **WHEN** un usuario con rol `presentacion` intenta una operación de escritura (POST/PUT) o accede a una sección no permitida
- **THEN** el sistema responde con error de acceso denegado

#### Scenario: Usuario de presentación con lectura permitida
- **WHEN** un usuario con rol `presentacion` consulta (GET) manifiestos, combustibles, tipo de cambio, precio marcador, la lista de clientes o el panel
- **THEN** el sistema responde con los datos

#### Scenario: Administrador con acceso total
- **WHEN** un usuario con rol `admin` accede a cualquier endpoint
- **THEN** el sistema permite el acceso

### Requirement: Acceso por rol en la interfaz

El sistema SHALL mostrar las secciones de la interfaz según el rol: `admin` ve todas las secciones y la sección Usuarios; `presentacion` ve Manifiestos, Combustibles, Presentación, Precio Marcador y Tipo de Cambio, sin los botones de acción que ejecutan corridas o modifican datos.

#### Scenario: Usuario de presentación
- **WHEN** un usuario con rol `presentacion` entra a la aplicación
- **THEN** ve las secciones Manifiestos, Combustibles, Presentación, Precio Marcador y Tipo de Cambio, y no ve los botones que ejecutan corridas ni editan datos

#### Scenario: Administrador
- **WHEN** un usuario con rol `admin` entra a la aplicación
- **THEN** ve todas las secciones y la sección Usuarios

#### Scenario: Sin sesión
- **WHEN** la aplicación no tiene sesión iniciada
- **THEN** muestra la pantalla de inicio de sesión y no las secciones

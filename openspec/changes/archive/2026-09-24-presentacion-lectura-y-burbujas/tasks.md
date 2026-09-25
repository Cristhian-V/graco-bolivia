## 1. Backend — acceso por rol

- [x] 1.1 Ampliar `guardApi` en `middleware/auth.js` para permitir a `presentacion` los `GET` de `/dashboard/*`, `/manifiestos*`, `/combustibles*`, `/tipo-cambio*`, `/precio-marcador*` y `/clientes`, manteniendo las escrituras solo para `admin`. Verificar con `curl`: `presentacion` recibe 200 en `GET /api/combustibles` y 403 en `POST /api/combustibles/normalizar`.

## 2. Backend — marcadores de referencia

- [x] 2.1 Crear `db/init/008_marcadores_burbuja.sql` con la tabla `marcadores_burbuja` (`grafico`, `valor`, `orden`, `UNIQUE(grafico, valor)`) y las iniciales 18 y 16.5 para `empresa` y `ypfb`; verificar que el init aplica el archivo y la tabla existe
- [x] 2.2 Agregar `GET /api/dashboard/marcadores` y `PUT /api/dashboard/marcadores/:grafico` (reemplaza el conjunto); verificar con `curl`: `admin` guarda, cualquiera lee, `presentacion` recibe 403 al guardar

## 3. Frontend — roles y botones

- [x] 3.1 Cambiar `SECTIONS` a `roles: [...]` y el filtro a `s.roles.includes(user.rol)`; verificar que `presentacion` ve Manifiestos, Combustibles, Presentación, Precio Marcador y Tipo de Cambio, y `admin` ve todo
- [x] 3.2 Pasar `canWrite` a `ManifiestosSection`, `CombustiblesSection`, `TipoCambioSection` y `PrecioMarcadorSection` y ocultar los botones de acción (Procesar, Sincronizar T/C, Editar, Ignorar, Actualizar, Cargar/Procesar/Rellenar/Aplicar) cuando no sea admin; conservar lecturas (selectores, mes, Refrescar, Descargar Excel, Docs); verificar `vite build`

## 4. Frontend — gráficos de burbujas

- [x] 4.1 Apilar los dos gráficos de burbujas a ancho completo (quitar `dash-row`/`dash-half`)
- [x] 4.2 En `d3Bubble`: dibujar elipses aplanadas 50% (`rx=14, ry=7`), mostrar el volumen como número encima, usar la lista de marcadores recibida como parámetro y ampliar el dominio Y para incluir el mayor marcador
- [x] 4.3 Agregar el editor de marcadores por gráfico (solo admin) con "Aplicar" que llama al `PUT`, y cargar los marcadores desde `GET /api/dashboard/marcadores` al montar; verificar que persisten al recargar

## 5. Validación

- [x] 5.1 Verificar end-to-end por rol (login `admin` y `presentacion`) y la persistencia de marcadores; validar con `openspec validate presentacion-lectura-y-burbujas`

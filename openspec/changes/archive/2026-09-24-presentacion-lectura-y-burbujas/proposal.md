## Why

El rol `presentacion` está pensado como visor, pero hoy solo ve Presentación y Precio Marcador, y el backend además le bloquea la lectura de Precio Marcador (403): la sección aparece en el menú pero no carga datos. Se necesita que `presentacion` acceda en **solo lectura** a Manifiestos, Combustibles, Presentación, Precio Marcador y Tipo de Cambio, mientras el `admin` conserva todo. Aparte, los gráficos de burbujas (Empresa y YPFB) necesitan ajustes: apilarlos a ancho completo, permitir marcadores de referencia configurables y persistentes, y mostrar el volumen sobre cada burbuja con burbujas aplanadas.

## What Changes

- El rol `presentacion` ve (solo lectura): **Manifiestos, Combustibles, Presentación, Precio Marcador, Tipo de Cambio**. El `admin` ve todas las secciones.
- Se ocultan los botones de acción (procesar, sincronizar, normalizar, editar, ignorar, actualizar) para `presentacion`.
- El backend permite a `presentacion` los `GET` de lectura de esas secciones y le sigue bloqueando los `POST`/`PUT` (muta solo el admin).
- Los gráficos de burbujas (Precio Promedio por Empresa y Precio Promedio YPFB) pasan a **dos filas, cada uno a ancho completo**.
- **Marcadores de referencia dinámicos por gráfico**: el usuario agrega/quita marcadores y les da un valor; se guardan en la base de datos y se aplican al pulsar **Aplicar** (al quitar, se borran de la BD).
- Las burbujas se muestran **aplanadas (50% de alto)** y con el **volumen como número encima** de cada una; el tamaño queda fijo (no proporcional al volumen).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities
- `autenticacion`: el control de acceso por rol se amplía para que `presentacion` tenga lectura de Manifiestos, Combustibles, Tipo de Cambio y Precio Marcador, manteniendo las escrituras solo para `admin`; y cambia el conjunto de secciones visibles en la interfaz.
- `presentacion-datos`: los gráficos de burbujas cambian de layout, presentación (aplanado y volumen visible) y se agregan marcadores de referencia configurables y persistentes.

## Impact

- **Frontend**: `App.jsx` (modelo de roles por sección + ocultar botones por rol), `DashboardSection.jsx` (layout, `d3Bubble`, marcadores), `api.js` (endpoints de marcadores).
- **Backend**: `middleware/auth.js` (`guardApi` con lectura permitida a `presentacion`), `routes/api.js` (endpoints de marcadores), servicio de presentación.
- **Base de datos**: nueva tabla de marcadores de referencia por gráfico (`db/init/00X_...sql`).

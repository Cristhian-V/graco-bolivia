## Context

Ver `proposal.md` y los deltas. El frontend usa un modelo de secciones con `rol: 'admin' | null`, filtrado con `!s.rol || s.rol === user.rol`; el backend (`middleware/auth.js::guardApi`) deja a `presentacion` solo `/auth/*` y `/dashboard/*`, por lo que hoy la sección Precio Marcador le devuelve 403. Los gráficos de burbujas viven en `DashboardSection.jsx` (`d3Bubble`), con líneas fijas `[18, 16.5]` y círculos de radio fijo.

## Goals / Non-Goals

**Goals:**
- `presentacion` con acceso de solo lectura a Manifiestos, Combustibles, Tipo de Cambio y Precio Marcador, además de Presentación.
- Ocultar botones de acción para `presentacion` y bloquear las escrituras en el backend.
- Burbujas a ancho completo, apiladas, aplanadas, con volumen visible y marcadores configurables y persistentes.

**Non-Goals:**
- No cambiar los roles existentes ni añadir roles nuevos.
- No hacer el tamaño de burbuja proporcional al volumen (se mantiene fijo).
- No permitir a `presentacion` ejecutar corridas ni editar datos.

## Decisions

### D1 — Secciones por lista de roles

`SECTIONS` pasa de `rol: 'admin' | null` a `roles: ['admin' | 'presentacion', ...]`, y el filtro a `s.roles.includes(user.rol)`. `presentacion`: manifiestos, combustibles, presentacion, precio-marcador, tipo-cambio. `admin`: todas.

- Alternativa: mantener `rol` con excepciones. Descartada: la lista explícita es más legible y extensible.

### D2 — Lectura permitida en el backend

`guardApi` permite a cualquier rol autenticado los `GET` sobre `/dashboard/*`, `/manifiestos*`, `/combustibles*`, `/tipo-cambio*`, `/precio-marcador*` y `/clientes`; cualquier otro método o ruta exige `admin`. Los `POST`/`PUT` (procesar, sincronizar, normalizar, editar, ignorar, actualizar, guardar marcadores) siguen siendo solo `admin`.

```js
const lecturaPermitida = (method, p) =>
  method === 'GET' && (
    p.startsWith('/dashboard') || p.startsWith('/manifiestos') ||
    p.startsWith('/combustibles') || p.startsWith('/tipo-cambio') ||
    p.startsWith('/precio-marcador') || p === '/clientes');
```

- Alternativa: declarar roles por ruta. Descartada para no reescribir todo el router; la regla "GET de estas secciones" cubre el caso.

### D3 — Ocultar acciones según rol

Los componentes con acciones (`ManifiestosSection`, `CombustiblesSection`, `TipoCambioSection`, `PrecioMarcadorSection`) reciben `canWrite` (o `rol`) y solo renderizan los botones de acción si el usuario es `admin`. Se conservan las lecturas: selectores, filtro de mes, "Refrescar", "Descargar Excel" y "Docs".

### D4 — Layout de las burbujas

Se elimina el `dash-row`/`dash-half` de los dos gráficos de burbujas y cada uno pasa a un `ChartCard` de ancho completo, apilados.

### D5 — Marcadores persistidos en BD

Nueva tabla `marcadores_burbuja (id, grafico, valor, orden, UNIQUE(grafico, valor))`, con iniciales 18 y 16.5 para `empresa` y `ypfb`. Endpoints:

- `GET /api/dashboard/marcadores` → `{ empresa: [...], ypfb: [...] }` (solo lectura, cualquier rol).
- `PUT /api/dashboard/marcadores/:grafico` con `{ valores: [...] }` → reemplaza el conjunto (borra los quitados e inserta los vigentes); solo `admin`.

El botón **Aplicar** del editor llama al `PUT`. Al recargar, los marcadores se leen del `GET`.

- Alternativa: guardar en localStorage. Descartada por pedido explícito (debe persistir en BD).

### D6 — Burbujas aplanadas y volumen visible

En `d3Bubble` las burbujas pasan de círculo `r=14` a elipse `rx=14, ry=7` (aplanado 50%) y se agrega un `text` encima con el volumen (`fmt(volumen, 0) m³`). El dominio Y se ajusta para incluir el mayor marcador (`yMax = max(20, max(precio, marcadores) + 1)`), evitando que un marcador quede fuera. Las líneas usan la lista de marcadores configurada en vez de `[18, 16.5]`.

## Risks / Trade-offs

- [Ampliar la lectura a `presentacion` expone datos operativos] → es el objetivo pedido; las escrituras siguen bloqueadas.
- [El editor de marcadores es un `PUT` y `presentacion` no puede guardar] → el editor solo se muestra al `admin`; `presentacion` solo ve los marcadores guardados.
- [Burbujas aplanadas pierden área] → se compensa con la etiqueta de volumen encima.
- [Marcadores fuera del rango 0–20] → el eje Y se amplía dinámicamente.

## Migration Plan

1. Agregar la tabla `marcadores_burbuja` + seed de 18/16.5 en `db/init`.
2. Backend: `guardApi` ampliado, endpoints de marcadores, servicio.
3. Frontend: roles por sección, `canWrite`, layout, `d3Bubble`, editor de marcadores.
4. Verificar: login `presentacion` (ve las 5 secciones, sin botones de escritura; backend 403 en escrituras), y los marcadores persisten al recargar.
5. Rollback: quitar el editor y los endpoints; la tabla queda inerte.

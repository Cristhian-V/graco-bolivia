## Context

Ver `proposal.md` y el delta. El resaltado del gráfico de Frecuencia vive en `FrecuenciaAduanas` (`DashboardSection.jsx`), que mantiene un estado `highlight` compartido entre la leyenda y la tabla de aduanas, y reejecuta `d3MultiLine` al cambiar. El color del spread de la tabla semanal es la clase `pos`/`neg` en `index.css`.

## Goals / Non-Goals

**Goals:**
- Permitir fijar el resaltado de una línea con un clic, controlado por una casilla.
- Colorear el spread semanal (positivo azul, negativo verde).

**Non-Goals:**
- No cambia el modelo de datos ni el backend.
- No cambia el resaltado por hover existente.

## Decisions

### D1 — Separar hover de fijado

Se introducen tres estados: `hover` (temporal), `pinned` (fijado) y `fijar` (casilla). El resaltado efectivo es `hover || (fijar ? pinned : null)`. Así el hover siempre gana mientras el cursor está encima, y al salir vuelve al fijado (si la casilla está activa).

- Alternativa: un único estado sobrescrito. Descartada: perdería el hover temporal cuando hay un fijado.

### D2 — Clic para fijar/despinnar

En la leyenda, `onClick` alterna `pinned` (mismo nombre lo despinna), solo si `fijar` está activo. Al desactivar la casilla se limpia `pinned`.

### D3 — Colores del spread

Se intercambian los colores de `.dash-weekly .pos` (rojo `#dc2626`) y `.dash-weekly .neg` (verde `#16a34a`).

## Risks / Trade-offs

- [Confusión si la casilla está activa y el usuario espera hover] → el hover sigue funcionando siempre; la casilla solo agrega persistencia.
- [Contraste de colores] → azul y verde con buen contraste sobre fondo blanco; el valor sigue mostrando el signo, no solo el color.

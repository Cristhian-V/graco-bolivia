## Why

Dos ajustes de usabilidad del panel: en el gráfico de Frecuencia de Operaciones el resaltado de una línea solo dura mientras el cursor está encima, y conviene poder fijarlo con un clic; y en la tabla de precio semanal el color del spread (verde/rojo) no sigue la convención pedida (positivo azul, negativo verde).

## What Changes

- **Gráfico de Frecuencia**: se agrega una casilla **"Fijar selección"**. Con la casilla activa, al hacer clic en el nombre de un importador en la leyenda su línea queda resaltada de forma persistente hasta que se haga clic en otro nombre (o en el mismo para despinnar). Con la casilla inactiva, el resaltado sigue siendo solo por hover.
- **Tabla de Precio Promedio Ponderado por Semana (USD/m³)**: el valor del spread se colorea **rojo cuando es positivo** y **verde cuando es negativo**.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities
- `presentacion-datos`: se agrega el resaltado fijable en el gráfico de Frecuencia y el color del spread en la tabla semanal.

## Impact

- **Frontend**: `DashboardSection.jsx` (componente `FrecuenciaAduanas`, tabla semanal), `index.css` (colores del spread y estilos de la casilla).
- Sin cambios de backend ni de base de datos.

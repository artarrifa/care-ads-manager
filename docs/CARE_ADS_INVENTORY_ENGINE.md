# Motor de Inventario & Capacidad — Care Ads Manager V1.0

## 1. Definición del Inventario Publicitario

El inventario de CareTech Services se organiza jerárquicamente:
- **Juego / Plataforma**: `solitario` (y futuros juegos PWA).
- **Ubicación (Placement)**:
  - `solitario_top`: Banner superior fija o flotante.
  - `solitario_bottom`: Banner inferior en la barra de control del juego.
- **Ventana Temporal de Rotación**: Turnos discretos de 60 segundos (1 minuto) de duración.

---

## 2. Capacidad Teórica vs Asignada vs Real

Es mandatorio distinguir con rigor las siguientes magnitudes:

$$\text{Slots Teóricos por Hora} = 60 \text{ minutos} \times 1 \text{ slot/minuto} = 60 \text{ slots/hora por ubicación}$$

1. **Slots Teóricos**: Máxima capacidad de programación del planificador (60 por hora por ubicación).
2. **Slots Asignados**: Cuotas reservadas contractualmente para clientes activos.
3. **Turnos Servidos**: Solicitudes de decisión respondidas por el servidor API.
4. **Impresiones Válidas (IAB)**: Ocasiones en que un jugador real mantuvo el banner visible (≥50% de píxeles) durante ≥1000ms.
5. **Segundos Efectivos**: Tiempo acumulado de visualización real medido por el cliente PWA.

> **Importante**: Tener 60 slots en una hora no significa que existan 60 jugadores simultáneos ni que el anuncio sea visto si el juego se encuentra minimizado o en una pestaña de fondo.

---

## 3. Algoritmo de Disponibilidad y Sobrevigilancia
Para prevenir sobreventa de inventario (*overbooking*):
- El sistema consulta la suma de turnos ocupados en la ventana de fecha solicitada.
- Si el número de campañas activas concurrentes para una ubicación alcanza el límite de saturación (ej. 30 campañas simultáneas en rotación):
  - El sistema marca el estado de la ubicación como `WAITLISTED`.
  - Ofrece al anunciante una fecha de inicio posterior o la opción de aplicar tarifa de prioridad (*Bypass Fee*) para entrar en el algoritmo ponderado.

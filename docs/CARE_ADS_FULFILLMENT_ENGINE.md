# Motor de Cumplimiento & Compensaciones — Care Ads Manager V1.0

## 1. Supervisión de Cumplimiento Contractual

El motor de cumplimiento ejecuta auditorías periódicas automatizadas sobre las órdenes de campaña activas:
- **Cálculo de Progresión Temporal**:
  $$\text{Progreso Temporal (\%)} = \frac{\text{NOW} - \text{flight\_start}}{\text{flight\_end} - \text{flight\_start}} \times 100$$
- **Cálculo de Entrega Efectiva**:
  - Horas de servidor disponibles vs incidentes reportados.
  - Impresiones registradas vs promedio histórico del juego.
- **Detección de Desviaciones**:
  - Si una campaña acumula un retraso superior al 15% respecto a su curva teórica de entrega, el sistema emite una alerta operativa (`ALERT_FULFILLMENT_LAG`).

---

## 2. Política de Compensaciones (Make-Goods)

En concordancia con la Cláusula 12 del Contrato Marco Digital V1.0:
1. **Causales de Compensación**:
   - Mantenimientos no programados o caídas del servidor que superen el 5% del tiempo contratado.
   - Fallas técnicas en el motor de decisión que impidan la rotación de un anuncio activo.
2. **Modalidad de Compensación**:
   - **Extensión Temporal Gratuita**: Se prorroga la fecha `flight_end` por los días u horas equivalentes al periodo de indisponibilidad.
   - **Incremento de Ponderación**: En campañas por impresiones, se eleva la prioridad de rotación en los turnos siguientes para recuperar la cuota pactada.
3. **Registro en Base de Datos**:
   - Toda compensación se formaliza en la tabla `compensations`, vinculada a la orden original y firmada digitalmente en el registro de auditoría.

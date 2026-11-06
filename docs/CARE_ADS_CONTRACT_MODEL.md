# Modelo Contractual — Care Ads Manager V1.0

## 1. Marco Jurídico Aplicable
La contratación de pauta publicitaria en Care Ads Manager se rige por:
- **Ley 1480 de 2011** (Estatuto del Consumidor de Colombia) — Normas de protección y publicidad engañosa.
- **Ley 527 de 1999** — Validez jurídica y probatoria de los mensajes de datos y comercio electrónico.
- **Ley 1581 de 2012** y Decreto 1377 de 2013 — Protección de Datos Personales (Habeas Data).
- Directrices y circulares de la **Superintendencia de Industria y Comercio (SIC)** sobre comercio electrónico y publicidad digital.

---

## 2. Estructura Contractual Bipartita

### 2.1. Contrato Marco de Publicidad Digital (CMPD)
Documento general de 25 cláusulas que regula la relación permanente entre CareTech Services SAS y el Anunciante.
Ubicación de la plantilla oficial:
`care-ads/contracts/templates/CONTRATO_MARCO_PUBLICIDAD_DIGITAL_V1.md`

Aspectos esenciales regulados:
- **Naturaleza del Servicio**: Pauta digital rotativa no exclusiva en juegos PWA.
- **Propiedad Intelectual**: El anunciante garantiza titularidad de marcas, logos y textos suministrados, manteniendo indemne a CareTech.
- **Ausencia de Garantía de Conversión**: Se garantiza disponibilidad de emisión técnica, pero no ventas, registros o conversiones comerciales del anunciante.
- **Fallas de Servicio y Compensaciones**: En caso de interrupciones técnicas imputables a CareTech superiores al 5% del periodo contratado, la compensación se realizará mediante extensión proporcional de vigencia (*make-good*), sin penalidades económicas directas.
- **Jurisdicción**: Tribunales de la República de Colombia.

### 2.2. Orden de Campaña Individual (OCI)
Cada pauta genera una Orden de Campaña vinculada al Contrato Marco, conteniendo:
- Identificador único de orden (`order_code`).
- Fechas exactas de inicio y terminación (`flight_start`, `flight_end`).
- Ubicación publicitaria asignada (`placement_id`).
- Valor total pactado (USD / COP) y forma de pago.
- Hash criptográfico de los términos aceptados.

---

## 3. Protocolo de Aceptación Digital Probatoria
Para conferir plena fuerza ejecutiva y probatoria ante la SIC o tribunales:

1. El anunciante debe marcar explícitamente el checkbox:
   > *"He leído y acepto el Contrato Marco de Publicidad Digital V1.0 y las condiciones comerciales de esta orden."*
2. El sistema captura la siguiente evidencia:
   - Dirección IP pública del aceptante.
   - User Agent completo del navegador.
   - Marca temporal exacta en formato UTC (`accepted_at`).
   - Identificador del usuario autenticado (`user_id`).
   - Hash SHA-256 inmutable del texto del contrato en ese instante:
     $$\text{contract\_hash} = \text{SHA256}(\text{Contenido Contrato} + \text{Metadata Orden})$$
3. El `contract_hash` se almacena en la tabla `campaign_orders` y se registra en la cadena de auditoría criptográfica.

---

## 4. Certificado de Cumplimiento Contractual
Al concluir la vigencia de la pauta, el sistema emite el certificado digital que contiene:
- Resumen de entregas: impresiones IAB validadas y segundos totales en pantalla.
- Registro de incidentes técnicos o interrupciones si existieron.
- Estado de la cuenta: valor facturado, recaudado y saldo conciliado ($0.00).
- Sello de integridad con código QR y verificación hash.

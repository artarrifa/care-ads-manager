# CONTRATO MARCO DE PRESTACIÓN DE SERVICIOS PUBLICITARIOS DIGITALES
**Versión:** 1.0-2026  
**Fecha de Entrada en Vigor:** 1 de enero de 2026  
**Prestador del Servicio:** CARETECH SERVICES S.A.S., sociedad comercial legalmente constituida en la República de Colombia.  
**Marco Normativo de Referencia:** Ley 1480 de 2011 (Estatuto del Consumidor), Circular Única de la Superintendencia de Industria y Comercio (SIC) y Ley 1581 de 2012 (Habeas Data).  

---

### CLÁUSULA PRIMERA — IDENTIFICACIÓN DE LAS PARTES
1.1. **EL PRESTADOR:** CARETECH SERVICES S.A.S., titular y operador de la red de aplicaciones web progresivas (PWA) de entretenimiento y salud digital ("CareTech Games").  
1.2. **EL ANUNCIANTE:** La persona natural o jurídica cuyos datos de identificación, razón social, documento de identificación tributaria (NIT o equivalente) y dirección de correo electrónico son consignados y autenticados al momento de emitir la correspondiente Orden de Campaña a través del portal publicitario.

---

### CLÁUSULA SEGUNDA — OBJETO DEL SERVICIO
El presente Contrato tiene por objeto regular las condiciones jurídicas, técnicas y comerciales bajo las cuales EL PRESTADOR publicará y difundirá el material publicitario (banners, logos, textos e hipervínculos) suministrado por EL ANUNCIANTE dentro de los espacios habilitados en las aplicaciones PWA de CareTech Games (incluyendo "Solitario Care", "Sudoku Care" y demás títulos del ecosistema).

---

### CLÁUSULA TERCERA — DEFINICIONES TÉCNICAS Y COMERCIALES
* **Ubicación (*Placement*):** Espacio gráfico reservado en pantalla (Superior o Inferior).
* **Turno de Rotación (*Slot*):** Intervalo de tiempo continuo (60 segundos) en el cual un anuncio activo es seleccionado y habilitado por el servidor de publicidad (*Ad-Server*).
* **Impresión Válida IAB:** Exposición publicitaria donde al menos el cincuenta por ciento (50%) de los píxeles del banner se encuentran dentro del área visible del navegador (*viewport*) durante un período mínimo continuo de un (1) segundo, excluyendo períodos en los que la pestaña del navegador permanezca en segundo plano según la API de Visibilidad de Página (*Page Visibility API*).
* **Orden de Campaña:** Documento electrónico anexo que detalla el producto contratado, fechas de inicio y terminación, frecuencia, tarifa, moneda y canales de pago.

---

### CLÁUSULA CUARTA — MODALIDADES Y PRODUCTOS PUBLICITARIOS
EL PRESTADOR comercializa las siguientes modalidades de contratación:
1. **Modalidad por Calendario (*TIME*):** Reserva y disponibilidad de participación en la rotación durante fechas determinadas.
2. **Modalidad por Turnos Reservados (*SLOT*):** Intervalos específicos de exposición horaria con prioridad.
3. **Modalidad por Impresiones Garantizadas (*IMPRESSION*):** Cantidad pactada de visualizaciones válidas medidas bajo el estándar técnico IAB.
4. **Modalidad Mixta (*HYBRID*):** Combinación estructurada de turnos y metas de entrega.

---

### CLÁUSULA QUINTA — CONDICIONES ECONÓMICAS Y FORMA DE PAGO
5.1. Las tarifas correspondientes a cada plan son las fijadas en la Orden de Campaña y aceptadas previo al desembolso.  
5.2. **Regla de Prepago y Confirmación:** Ninguna campaña será activada en los juegos hasta tanto la pasarela de pagos autorizada (ePayco, PayPal, Mercado Pago o Binance Pay) emita el comprobante definitivo de confirmación de fondos (*Webhook Verificado*). Un intento de pago reportado en el navegador no constituye pago confirmado.  
5.3. **Facturación Electrónica:** EL PRESTADOR emitirá y remitirá al correo registrado por EL ANUNCIANTE la respectiva Factura Electrónica de Venta con validación previa de la Dirección de Impuestos y Aduanas Nacionales (DIAN).

---

### CLÁUSULA SEXTA — FORMA DE CONTRATACIÓN Y ACEPTACIÓN ELECTRÓNICA
De conformidad con la Ley 527 de 1999 (Comercio Electrónico y Mensajes de Datos), la aceptación expresa del presente contrato mediante casilla de verificación (*checkbox*) en el formulario web, combinada con la dirección IP del suscriptor, fecha y hora UTC, y el hash criptográfico SHA-256 del texto del contrato, constituye prueba plena y vinculante del consentimiento informado entre las partes.

---

### CLÁUSULA SÉPTIMA — OBLIGACIONES DE EL ANUNCIANTE
1. Garantizar que es titular o licenciatario legítimo de las marcas, logotipos, imágenes, textos y enlaces provistos.
2. Asegurar que los anuncios y páginas de destino (*landing pages*) cumplan con el Estatuto del Consumidor (Ley 1480 de 2011), informando con veracidad sobre precios, calidades y condiciones de bienes y servicios, sin inducir a engaño o error al público.
3. No emplear el servicio para promover actividades ilícitas, captación no autorizada de dinero, juegos de azar no regulados por Coljuegos, contenido para adultos, o material discriminatorio.

---

### CLÁUSULA OCTAVA — OBLIGACIONES DE CARETECH SERVICES S.A.S.
1. Habilitar la emisión y rotación de los anuncios en las fechas y horarios convenidos en la Orden de Campaña.
2. Mantener la infraestructura tecnológica y el servidor de anuncios con un nivel de disponibilidad operativa mínima del noventa y nueve por ciento (99.0%).
3. Proveer al cierre de la campaña un informe o certificado digital de cumplimiento que detalle los turnos ejecutados, impresiones válidas medidas y clics recibidos.

---

### CLÁUSULA NOVENA — DERECHO DE MODERACIÓN Y RECHAZO
EL PRESTADOR se reserva el derecho potestativo de auditar, suspender temporalmente o rechazar cualquier anuncio que vulnere políticas legales, regulatorias o de seguridad. En caso de rechazo motivado previo a la emisión, EL PRESTADOR reembolsará el importe neto pagado o permitirá al anunciante corregir la creatividad sin costo adicional.

---

### CLÁUSULA DÉCIMA — MEDICIÓN, AUDITORÍA Y CONSERVACIÓN PROBATORIA
10.1. Las métricas de entrega se registrarán mediante el SDK de Care Ads con eventos inmutables encadenados por hash criptográfico.  
10.2. **Conservación Documental:** En cumplimiento de las instrucciones de la Superintendencia de Industria y Comercio (SIC), EL PRESTADOR conservará copia digital de los contratos, piezas creativas, pagos y bitácora de emisión por un período no inferior a tres (3) años contados a partir de la fecha de terminación de la campaña.

---

### CLÁUSULA UNDÉCIMA — INCUMPLIMIENTO Y COMPENSACIONES
En caso de falla técnica imputable a EL PRESTADOR que interrumpa la emisión por más de dos (2) horas acumuladas dentro del período contratado, EL PRESTADOR otorgará a EL ANUNCIANTE una compensación consistente en:
1. Extensión de la vigencia de la campaña por un término equivalente al doble del tiempo de interrupción; o
2. Turnos de reposición adicionales; o
3. Saldo a favor (crédito comercial) para futuras órdenes.

---

### CLÁUSULA DUODÉCIMA — PROTECCIÓN DE DATOS PERSONALES
Las partes declaran conocer y dar cumplimiento a la Ley Estatutaria 1581 de 2012 y su Decreto Reglamentario 1377 de 2013. Los datos suministrados por EL ANUNCIANTE serán tratados conforme a la Política de Privacidad de CareTech Services para fines exclusivos de facturación, soporte operativo y cumplimiento contractual.

---

### CLÁUSULA DECIMOTERCERA — LEGISLACIÓN APLICABLE Y JURISDICCIÓN
El presente contrato se rige íntegramente por las leyes de la República de Colombia. Cualquier controversia que no pueda ser resuelta de mutuo acuerdo dentro de los treinta (30) días calendario siguientes a la notificación formal será sometida a la jurisdicción ordinaria de los jueces de la República de Colombia.

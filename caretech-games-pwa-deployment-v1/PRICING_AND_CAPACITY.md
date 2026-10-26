# CareTech Games - Modelo Comercial, Precios y Capacidad de Slots (V2)

Este documento define la economía de inventario publicitario, el scheduler de slots de 60 segundos, la regla de prioridad y la capacidad matemática por juego y multiplataforma.

---

## 1. Tabla de Planes y Frecuencia

| Plan | Frecuencia | Impresiones | Precio Comercial | Facturación |
| :--- | :--- | :--- | :--- | :--- |
| **Entrada** | 1 vez por semana | 1 / sem (~4 / mes) | **USD $1** | Semanal |
| **Presencia** | 3 veces por semana | 3 / sem (~12 / mes) | **USD $3** | Semanal |
| **Diario** | 1 vez al día | 1 / día (30 / mes) | **USD $15** | Mensual |
| **Frecuente** | Cada 6 horas | 4 / día (120 / mes) | **USD $35** | Mensual |
| **Intensivo** | Cada 3 horas | 8 / día (240 / mes) | **USD $60** | Mensual |
| **Máximo** | Cada hora todos los días | 24 / día (720 / mes) | **USD $120** | Mensual |
| **Prioridad VIP** | Saltar cola de espera | Siguiente slot compatible | **+ USD $120** | Tarifa única |

---

## 2. Capacidad Matemática y Multiplicador de Ingresos

### Parámetros del Inventario:
- **Duración por slot:** 60 segundos (1 minuto exacto).
- **Slots por hora por banner:** 60 slots/hora.
- **Banners por juego:** 2 banners independientes (`top` y `bottom`).
- **Slot-minutos disponibles por juego:**
  - 120 slot-minutos / hora
  - 2.880 slot-minutos / día
  - 86.400 slot-minutos / mes

### Techo de Ingresos Teórico por Juego (Solo Plan Máximo de $120):
- **Banner Superior:** 60 campañas × $120 = **$7.200 USD/mes**
- **Banner Inferior:** 60 campañas × $120 = **$7.200 USD/mes**
- **Total por Juego:** **$14.400 USD/mes**

### Escalado Multi-Juego:
| Catálogo de Juegos | Banners Activos | Capacidad Máxima Estimada / Mes |
| :--- | :--- | :--- |
| 1 Juego (Solitario) | 2 | **$14.400 USD** |
| 3 Juegos (Solitario + Sudoku + Mahjong) | 6 | **$43.200 USD** |
| 5 Juegos (Catálogo Completo Care Games) | 10 | **$72.000 USD** |

---

## 3. Algoritmo Scheduler y Reglas de la Cola de Espera

1. **Prioridad por Frecuencia:** El scheduler asigna primero las campañas de alta frecuencia (Máximo, Intensivo, Frecuente).
2. **Relleno Dinámico:** Los minutos libres restantes se asignan a campañas diarias y semanales.
3. **Manejo de Saturación (WAITLISTED):**
   - Si el banner elegido (`solitario-top`) tiene sus 60 slots horarios ocupados, la campaña entra en estado `WAITLISTED`.
   - El anunciante puede:
     1. Esperar a la liberación de un slot.
     2. Moverse al banner alternativo (`solitario-bottom`).
     3. Seleccionar una frecuencia con disponibilidad.
     4. Adquirir el pase **Prioridad VIP (+USD $120)** para posicionarse al frente de la cola de espera para el próximo slot disponible sin alterar las campañas activas existentes.

---

## 4. Estructura de Links en Cada Banner

Cada banner publicitario horizontal soporta tres puntos de contacto medibles:
1. **Página Web Principal (`ad_click`):** Redirección al sitio web o landing page corporativa.
2. **Enlace de Donación (`ad_donation_click`):** Para fundaciones, proyectos sociales o propinas.
3. **Enlace de Tienda / Oferta (`ad_shop_click`):** Venta directa de productos, cupones y checkout.

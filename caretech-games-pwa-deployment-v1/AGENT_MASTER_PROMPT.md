# CareTech Games & Commerce V2 - Master Instructions

## Instrucción Central
Los juegos de CareTech Games deben ser **100% local-first / PWA**.
El servidor (Node.js/Hostinger/Cloudflare) administra exclusivamente:
- Portal de Juegos y Tienda de Autoservicio de Publicidad (`/games/publicidad/`).
- Pasarelas de Pago (PayPal y Criptomonedas / Binance Pay).
- Cola de Espera y Asignación de Slots de 60 segundos.
- Entrega de Banners sincronizados con ETag e IndexedDB.
- Analítica no invasiva por país y por juego.

**Bajo ninguna circunstancia un fallo de conexión o caída del servidor debe impedir que el usuario juegue.**

---

## Flujo del Anunciante
1. Acceso a `/games/publicidad/` (o `/publicidad/`).
2. Selección de Juego (`Solitario`, `Sudoku`, `Mahjong`, etc.).
3. Selección de Ubicación (`top` o `bottom`).
4. Carga de Creativos (Título, Texto, Logo, 3 Links: Web, Donación, Tienda/Oferta).
5. Selección de Frecuencia ($1/sem a $120/mes) + Opción Prioridad VIP (+$120 USD).
6. Verificación de disponibilidad de slots.
7. Pago vía **PayPal** (Tarjetas / Saldo USD) o **Cripto** (Binance Pay / USDT).
8. Moderación y activación en el Scheduler.

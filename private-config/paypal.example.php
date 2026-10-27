<?php
/**
 * CareTech Services - Private PayPal Configuration Template
 * 
 * INSTRUCCIONES:
 * 1. Copiar este archivo a: domains/caretechservices.com/caretech-private/paypal.php
 *    (al mismo nivel que public_html, NUNCA dentro de public_html).
 * 2. Asignar permisos estrictos: chmod 600 paypal.php
 * 3. Configurar tus credenciales de PayPal Developer.
 */

return [
    // Modo: 'sandbox' o 'live'
    'mode' => 'live',

    // Client ID de la app de PayPal
    'clientId' => 'PEGA_AQUI_TU_NUEVO_PAYPAL_CLIENT_ID',

    // Client Secret (NUNCA exponer en frontend ni en JSON públicos)
    'clientSecret' => 'PEGA_AQUI_TU_NUEVO_PAYPAL_CLIENT_SECRET',

    // Datos del comerciante
    'merchantEmail' => 'alexis.tarrifa@gmail.com',
    'merchantId' => '6L4ZTMT48MEEL',
    'meUsername' => 'alexistarrifa',
];

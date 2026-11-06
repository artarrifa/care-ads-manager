<?php
/**
 * CareTech Services - Configuración Privada Unificada de Pasarelas de Pago
 * 
 * INSTRUCCIONES DE SEGURIDAD:
 * 1. Copiar este archivo al servidor en:
 *    domains/caretechservices.com/caretech-private/payments.php
 *    (Ubicado fuera de public_html, NUNCA expuesto en la web).
 * 2. Asignar permisos estrictos en el servidor: chmod 600 payments.php
 * 3. Configurar tus credenciales obtenidas de los dashboards oficiales.
 */

return [
    // Moneda base y tasa de conversión
    'currency' => 'USD',
    'copExchangeRate' => 4000,

    // ==========================================
    // 1. CONFIGURACIÓN EPAYCO (Colombia / Latam)
    // Dashboard: https://dashboard.epayco.com/dashboard
    // Llaves en: Integraciones > Llaves API
    // ==========================================
    'epayco' => [
        // P_CUST_ID_CLIENTE (ID de cliente ePayco, ej. 123456)
        'pCustIdCliente' => '',

        // PUBLIC_KEY (Llave pública para inicializar checkout.js en frontend)
        'publicKey' => '',

        // PRIVATE_KEY (Llave privada para transacciones backend)
        'privateKey' => '',

        // P_KEY (Llave para verificación de firma HMAC/SHA-256 en webhooks de confirmación)
        'pKey' => '',

        // Modo de pruebas: true para pruebas / sandbox, false para cobros reales en producción
        'testMode' => true,

        // URLs del ecosistema
        'dashboardUrl' => 'https://dashboard.epayco.com/dashboard',
        'confirmationUrl' => 'https://caretechservices.com/api.php?action=epayco_confirm',
        'responseUrl' => 'https://caretechservices.com/pagos/respuesta/'
    ],

    // ==========================================
    // 2. CONFIGURACIÓN MERCADO PAGO
    // ==========================================
    'mercadopago' => [
        // Plan recurrente / suscripción provisto para CareTech:
        'soloPlanId' => 'ef5d45af5bd347a7830da2fbec0ea42d',
        'soloPlanCheckoutUrl' => 'https://www.mercadopago.com.co/subscriptions/checkout?preapproval_plan_id=ef5d45af5bd347a7830da2fbec0ea42d',

        // Credenciales de Mercado Pago Developers (opcional para Checkout Pro / API)
        'publicKey' => '',
        'accessToken' => '',

        // Webhook IPN
        'webhookUrl' => 'https://caretechservices.com/api.php?action=mercadopago_ipn'
    ],

    // ==========================================
    // 3. CONFIGURACIÓN PAYPAL (Checkout REST API & PayPal.Me)
    // ==========================================
    'paypal' => [
        'mode' => 'live',
        'clientId' => 'BAAqqtlAVEAYcI4HczDkLgzyejjP8NInCX8DojUaNHOLrpkdMB9nXNTClEUTSrNqzpDR76fc7T7HWPUEjU',
        'clientSecret' => 'EAyLUNFbJjUEIsfp7_uayQLPwl-QYngT2279hqh1SCkrMJTcMffhPLOp64k1QT5dIkYpdVHl_7-riCNK',
        'merchantEmail' => 'alexis.tarrifa@gmail.com',
        'merchantId' => '6L4ZTMT48MEEL',
        'meUsername' => 'alexistarrifa'
    ],

    // ==========================================
    // 4. CONFIGURACIÓN BINANCE PAY (Merchant API)
    // ==========================================
    'binancePay' => [
        'apiKey' => '',
        'secretKey' => '',
        'baseUrl' => 'https://bpay.binanceapi.com'
    ]
];

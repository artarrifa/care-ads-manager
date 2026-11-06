<?php
/**
 * CareTech Games Platform - Unified Backend API Bridge & Controller
 * Endpoints:
 * - GET  /wp-json/careads/v1/banners (and /games/api.php?action=banners)
 * - POST /wp-json/careads/v1/install/activate (and /games/api.php?action=activate)
 * - POST /wp-json/careads/v1/events/batch (and /games/api.php?action=events)
 * - GET  /api/v1/games/pricing
 * - GET  /api/v1/games/availability
 * - POST /api/v1/games/campaigns/create
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, If-None-Match");
header("Access-Control-Expose-Headers: ETag");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Data Directory
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
// The JSON stores hold advertiser contacts and telemetry: never serve them over HTTP.
$dataGuard = $dataDir . '/.htaccess';
if (!file_exists($dataGuard)) {
    @file_put_contents($dataGuard, "Require all denied\n");
}
$campaignsFile = $dataDir . '/campaigns.json';
$analyticsFile = $dataDir . '/analytics.json';
$devicesFile   = $dataDir . '/devices.json';
$paymentsFile  = $dataDir . '/payments.json';

// Detect Country Server-side (Cloudflare / GeoIP / Forwarded headers)
function getDetectedCountry() {
    return $_SERVER['HTTP_CF_IPCOUNTRY'] ??
           $_SERVER['HTTP_X_COUNTRY_CODE'] ??
           $_SERVER['GEOIP_COUNTRY_CODE'] ??
           $_SERVER['HTTP_X_GEOIP_COUNTRY'] ??
           'CO';
}

function getStoredJson($file) {
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

function saveStoredJson($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

// Load Private Payments & PayPal Configuration (strictly located outside public_html in caretech-private/)
$privatePaypalConfig = null;
$privatePaymentsConfig = null;
$possiblePrivateDirs = [
    dirname(__DIR__, 2) . '/caretech-private',
    dirname(__DIR__, 3) . '/caretech-private',
    __DIR__ . '/../../caretech-private',
    __DIR__ . '/../../../caretech-private',
    isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] . '/../caretech-private' : null
];

foreach ($possiblePrivateDirs as $privDir) {
    if (!$privDir || !is_dir($privDir)) continue;
    $paymentsPath = $privDir . '/payments.php';
    if (!$privatePaymentsConfig && file_exists($paymentsPath)) {
        $loaded = @include $paymentsPath;
        if (is_array($loaded)) {
            $privatePaymentsConfig = $loaded;
        }
    }
    $paypalPath = $privDir . '/paypal.php';
    if (!$privatePaypalConfig && file_exists($paypalPath)) {
        $loaded = @include $paypalPath;
        if (is_array($loaded)) {
            $privatePaypalConfig = $loaded;
        }
    }
}

// Merge PayPal config if defined in payments.php
if (!empty($privatePaymentsConfig['paypal']) && is_array($privatePaymentsConfig['paypal'])) {
    $privatePaypalConfig = array_merge($privatePaypalConfig ?: [], $privatePaymentsConfig['paypal']);
}

// Extracted gateway configurations
$epaycoConfig = $privatePaymentsConfig['epayco'] ?? [
    'pCustIdCliente' => '',
    'publicKey' => '',
    'privateKey' => '',
    'pKey' => '',
    'testMode' => true,
    'dashboardUrl' => 'https://dashboard.epayco.com/dashboard',
    'confirmationUrl' => 'https://caretechservices.com/api.php?action=epayco_confirm',
    'responseUrl' => 'https://caretechservices.com/pagos/respuesta/'
];

$mercadopagoConfig = $privatePaymentsConfig['mercadopago'] ?? [
    'soloPlanId' => 'ef5d45af5bd347a7830da2fbec0ea42d',
    'soloPlanCheckoutUrl' => 'https://www.mercadopago.com.co/subscriptions/checkout?preapproval_plan_id=ef5d45af5bd347a7830da2fbec0ea42d',
    'publicKey' => '',
    'accessToken' => '',
    'webhookUrl' => 'https://caretechservices.com/api.php?action=mercadopago_ipn'
];

// Load Pricing Config
$pricingFile = __DIR__ . '/../../config/pricing.json';
if (!file_exists($pricingFile)) {
    $pricingFile = __DIR__ . '/config/pricing.json';
}
if (!file_exists($pricingFile)) {
    $pricingFile = __DIR__ . '/pricing.json';
}
$pricingData = file_exists($pricingFile) ? json_decode(file_get_contents($pricingFile), true) : [
    'version' => '2.0.0',
    'currency' => 'USD',
    'paypalCurrency' => 'USD',
    'paypalMerchantEmail' => 'alexis.tarrifa@gmail.com',
    'paypalMerchantId' => '6L4ZTMT48MEEL',
    'paypalMeUsername' => 'alexistarrifa',
    'copExchangeRate' => 4000,
    'priorityFeeUsd' => 120,
    'plans' => [
        'entrada' => ['priceUsd' => 1.00, 'name' => 'Entrada'],
        'presencia' => ['priceUsd' => 3.00, 'name' => 'Presencia'],
        'diario' => ['priceUsd' => 15.00, 'name' => 'Diario'],
        'frecuente' => ['priceUsd' => 35.00, 'name' => 'Frecuente'],
        'intensivo' => ['priceUsd' => 60.00, 'name' => 'Intensivo'],
        'maximo' => ['priceUsd' => 120.00, 'name' => 'Máximo']
    ]
];

// Sanitize: Nunca permitir credenciales privadas en pricingData
unset($pricingData['paypalClientSecret']);
unset($pricingData['paypalClientId']);

// Generar orden oficial en PayPal REST API v2 (CheckoutNow)
function getPayPalRestOrderUrl($totalUsd, $campaignId, $brandName, $planId, $pricingData, $privatePaypalConfig = null) {
    $clientId = $privatePaypalConfig['clientId'] ?? null;
    $clientSecret = $privatePaypalConfig['clientSecret'] ?? null;
    if (!$clientId || !$clientSecret) {
        return null;
    }

    $ch = curl_init("https://api-m.paypal.com/v1/oauth2/token");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, "$clientId:$clientSecret");
    curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=client_credentials");
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/x-www-form-urlencoded"]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    $response = curl_exec($ch);
    curl_close($ch);

    $tokenData = json_decode($response, true);
    $token = $tokenData["access_token"] ?? null;
    if (!$token) {
        return null;
    }

    $orderPayload = [
        "intent" => "CAPTURE",
        "purchase_units" => [[
            "reference_id" => $campaignId,
            "custom_id" => $campaignId,
            "description" => "CareTech Games - Anuncio " . substr($brandName, 0, 50) . " ($planId)",
            "amount" => [
                "currency_code" => $pricingData['paypalCurrency'] ?? 'USD',
                "value" => number_format($totalUsd, 2, '.', '')
            ]
        ]],
        "application_context" => [
            "brand_name" => "CareTech Games",
            "landing_page" => "BILLING",
            "user_action" => "PAY_NOW",
            "return_url" => "https://caretechservices.com/games/publicidad/?payment=success&id=" . urlencode($campaignId),
            "cancel_url" => "https://caretechservices.com/games/publicidad/?payment=cancel&id=" . urlencode($campaignId)
        ]
    ];

    $ch2 = curl_init("https://api-m.paypal.com/v2/checkout/orders");
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_POST, true);
    curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($orderPayload));
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $token",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch2, CURLOPT_TIMEOUT, 8);
    $resOrder = curl_exec($ch2);
    $orderData = json_decode($resOrder, true);
    curl_close($ch2);

    foreach ($orderData["links"] ?? [] as $link) {
        if ($link["rel"] === "approve") {
            return $link["href"];
        }
    }

    return null;
}

// ==============================================================================
// 1. GET /wp-json/careads/v1/banners (Also matches /games/api.php?action=banners)
// ==============================================================================
$isBannersReq = (strpos($requestUri, '/wp-json/careads/v1/banners') !== false) ||
                ($action === 'banners') ||
                (strpos($requestUri, '/api/v1/ads') !== false);

if ($isBannersReq && $method === 'GET') {
    header('Content-Type: application/json');
    $game = $_GET['game'] ?? 'solitario';
    $placement = $_GET['placement'] ?? 'top';

    // If matching /api/v1/ads/:game/:placement
    if (preg_match('#/api/v1/ads/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_-]+)#', $requestUri, $matches)) {
        $game = $matches[1];
        $placement = $matches[2];
    }

    $currentMinute = (int)date('i');
    $etag = md5("care_banner_{$game}_{$placement}_{$currentMinute}");
    header("ETag: \"{$etag}\"");
    header("Cache-Control: public, max-age=60");

    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH'], '"') === $etag) {
        http_response_code(304);
        exit;
    }

    $campaigns = getStoredJson($campaignsFile);
    $matched = [];
    foreach ($campaigns as $camp) {
        if (($camp['gameId'] ?? '') === $game &&
            ($camp['placement'] ?? '') === $placement &&
            in_array($camp['status'] ?? '', ['ACTIVE', 'SCHEDULED', 'AUTHORIZED'])) {
            $matched[] = $camp;
        }
    }

    if (!empty($matched)) {
        $index = $currentMinute % count($matched);
        $ad = $matched[$index];
        echo json_encode([
            'campaignId' => $ad['id'] ?? $ad['campaignId'],
            'brandName' => $ad['brandName'],
            'headline' => $ad['headline'] ?: $ad['brandName'],
            'description' => $ad['description'],
            'logo' => $ad['logoUrl'] ?? $ad['logo'],
            'webUrl' => $ad['webUrl'],
            'donationUrl' => $ad['donationUrl'] ?? '',
            'shopUrl' => $ad['shopUrl'] ?? '',
            'slotMinute' => $currentMinute,
            'syncTime' => time()
        ]);
        exit;
    }

    // Default Fallback Banners
    if ($placement === 'top') {
        echo json_encode([
            'campaignId' => 'CAMP_CARE_LOYALTY',
            'brandName' => 'Care Loyalty',
            'headline' => 'Care Loyalty',
            'description' => 'Fidelidad digital en Apple & Google Wallet sin apps.',
            'logo' => 'https://caretechservices.com/assets/logo.png',
            'webUrl' => 'https://caretechservices.com/loyalty/',
            'donationUrl' => 'https://caretechservices.com/donar/',
            'shopUrl' => 'https://caretechservices.com/publicidad/',
            'slotMinute' => $currentMinute,
            'syncTime' => time()
        ]);
    } else {
        echo json_encode([
            'campaignId' => 'CAMP_CARE_INSTITUTIONAL',
            'brandName' => 'CareTech Services',
            'headline' => 'CareTech Services',
            'description' => 'Soluciones de software médico, teleasistencia y salud digital.',
            'logo' => 'https://caretechservices.com/assets/logo.png',
            'webUrl' => 'https://caretechservices.com',
            'donationUrl' => 'https://caretechservices.com/donar/',
            'shopUrl' => 'https://caretechservices.com/publicidad/',
            'slotMinute' => $currentMinute,
            'syncTime' => time()
        ]);
    }
    exit;
}

// ==============================================================================
// 2. POST /wp-json/careads/v1/install/activate (Device Registration)
// ==============================================================================
$isActivateReq = (strpos($requestUri, '/wp-json/careads/v1/install/activate') !== false) ||
                 ($action === 'activate');

if ($isActivateReq && $method === 'POST') {
    header('Content-Type: application/json');
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];

    $country = getDetectedCountry();
    $deviceEntry = [
        'gameId' => $data['gameId'] ?? 'solitario',
        'installIdHash' => $data['installIdHash'] ?? '',
        'firstActivation' => !empty($data['firstActivation']),
        'standalone' => !empty($data['standalone']),
        'uaClass' => $data['uaClass'] ?? 'desktop',
        'country' => $country,
        'registeredAt' => date('Y-m-d H:i:s'),
        'timestamp' => $data['timestamp'] ?? time()
    ];

    $devices = getStoredJson($devicesFile);
    // Avoid duplicates by hash
    $exists = false;
    foreach ($devices as $d) {
        if (($d['installIdHash'] ?? '') === $deviceEntry['installIdHash']) {
            $exists = true;
            break;
        }
    }

    if (!$exists && !empty($deviceEntry['installIdHash'])) {
        $devices[] = $deviceEntry;
        saveStoredJson($devicesFile, $devices);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Device activation recorded securely',
        'countryDetected' => $country
    ]);
    exit;
}

// ==============================================================================
// 3. POST /wp-json/careads/v1/events/batch (Analytics & Telemetry)
// ==============================================================================
$isEventsReq = (strpos($requestUri, '/wp-json/careads/v1/events/batch') !== false) ||
               ($action === 'events') ||
               (strpos($requestUri, '/api/v1/analytics/track') !== false);

if ($isEventsReq && $method === 'POST') {
    header('Content-Type: application/json');
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $country = getDetectedCountry();

    $events = $data['events'] ?? [];
    if (!empty($events)) {
        $analytics = getStoredJson($analyticsFile);
        foreach ($events as $evt) {
            $evt['country'] = $country;
            $evt['receivedAt'] = date('Y-m-d H:i:s');
            $analytics[] = $evt;
        }
        // Limit max stored telemetry records in json
        if (count($analytics) > 5000) {
            $analytics = array_slice($analytics, -5000);
        }
        saveStoredJson($analyticsFile, $analytics);
    }

    echo json_encode([
        'success' => true,
        'countryDetected' => $country,
        'eventsRecorded' => count($events)
    ]);
    exit;
}

// ==============================================================================
// 3.1. GET /games/api.php?action=admin_stats (Live Device & Telemetry Analytics)
// ==============================================================================
if ($action === 'admin_stats' || strpos($requestUri, '/api/v1/admin/stats') !== false) {
    header('Content-Type: application/json');
    $devices = getStoredJson($devicesFile);
    $analytics = getStoredJson($analyticsFile);
    $campaigns = getStoredJson($campaignsFile);

    $totalDevices = count($devices);
    $todayStr = date('Y-m-d');
    $todayDevices = 0;
    $countryCounts = [];
    $uaCounts = ['mobile' => 0, 'desktop' => 0, 'tablet' => 0];
    $pwaCount = 0;

    foreach ($devices as $d) {
        $reg = $d['registeredAt'] ?? '';
        if (strpos($reg, $todayStr) === 0) {
            $todayDevices++;
        }
        $c = $d['country'] ?? 'CO';
        $countryCounts[$c] = ($countryCounts[$c] ?? 0) + 1;
        $ua = $d['uaClass'] ?? 'mobile';
        $uaCounts[$ua] = ($uaCounts[$ua] ?? 0) + 1;
        if (!empty($d['standalone'])) {
            $pwaCount++;
        }
    }

    $eventCounts = [
        'ad_impression' => 0,
        'ad_click' => 0,
        'ad_donation_click' => 0,
        'ad_shop_click' => 0,
        'game_start' => 0,
        'game_win' => 0
    ];
    foreach ($analytics as $evt) {
        $type = $evt['eventType'] ?? '';
        if (isset($eventCounts[$type])) {
            $eventCounts[$type]++;
        }
    }

    echo json_encode([
        'success' => true,
        'stats' => [
            'totalDevices' => $totalDevices,
            'todayDevices' => $todayDevices,
            'pwaInstalls' => $pwaCount,
            'countryCounts' => $countryCounts,
            'uaCounts' => $uaCounts,
            'events' => $eventCounts,
            'recentDevices' => array_slice(array_reverse($devices), 0, 50),
            'campaignsCount' => count($campaigns)
        ]
    ]);
    exit;
}

// ==============================================================================
// 4. PRICING & CAMPAIGN STORE ENDPOINTS
// ==============================================================================
if ((strpos($requestUri, '/api/v1/games/pricing') !== false || $action === 'pricing') && $method === 'GET') {
    header('Content-Type: application/json');
    // Strip anything that looks like a credential, even if it is added back to pricing.json by mistake.
    $publicPricing = array_filter($pricingData, function ($key) {
        return !preg_match('/secret|token|password|apikey|api_key|clientid/i', $key);
    }, ARRAY_FILTER_USE_KEY);
    echo json_encode(['success' => true, 'pricing' => $publicPricing]);
    exit;
}

if ((strpos($requestUri, '/api/v1/games/availability') !== false || $action === 'availability') && $method === 'GET') {
    header('Content-Type: application/json');
    $game = $_GET['game'] ?? 'solitario';
    $placement = $_GET['placement'] ?? 'top';

    $campaigns = getStoredJson($campaignsFile);
    $activeCount = 0;
    foreach ($campaigns as $camp) {
        if (($camp['gameId'] ?? '') === $game && ($camp['placement'] ?? '') === $placement && in_array($camp['status'] ?? '', ['ACTIVE', 'SCHEDULED', 'AUTHORIZED'])) {
            $activeCount++;
        }
    }

    $available = max(0, 60 - $activeCount);

    echo json_encode([
        'success' => true,
        'game' => $game,
        'placement' => $placement,
        'totalSlotsPerHour' => 60,
        'occupiedSlots' => $activeCount,
        'availableSlots' => $available,
        'status' => $available > 0 ? 'AVAILABLE' : 'WAITLISTED',
        'priorityBypassFeeUsd' => 120
    ]);
    exit;
}

if ((strpos($requestUri, '/api/v1/games/campaigns/create') !== false || $action === 'create_campaign' || $action === 'create') && $method === 'POST') {
    header('Content-Type: application/json');
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];

    $campaignId = 'CAMP_' . time() . '_' . rand(1000, 9999);
    $gameId = $data['gameId'] ?? 'solitario';
    $placement = $data['placement'] ?? 'top';
    $planId = $data['planId'] ?? 'maximo';
    $hasPriority = !empty($data['hasPriority']);
    $paymentMethod = $data['paymentMethod'] ?? 'PAYPAL';

    $planInfo = $pricingData['plans'][$planId] ?? ['priceUsd' => 120.00];
    $basePrice = $planInfo['priceUsd'] ?? 120.00;
    $totalUsd = $basePrice + ($hasPriority ? 120.00 : 0.00);
    $totalCop = $totalUsd * ($pricingData['copExchangeRate'] ?? 4000);

    $newCampaign = [
        'id' => $campaignId,
        'brandName' => $data['brandName'] ?? 'Anunciante CareTech',
        'headline' => $data['headline'] ?? $data['brandName'] ?? 'Anuncio Patrocinado',
        'description' => $data['description'] ?? '',
        'logoUrl' => $data['logoUrl'] ?? '',
        'webUrl' => $data['webUrl'] ?? 'https://caretechservices.com',
        'donationUrl' => $data['donationUrl'] ?? '',
        'shopUrl' => $data['shopUrl'] ?? '',
        'gameId' => $gameId,
        'placement' => $placement,
        'planId' => $planId,
        'hasPriority' => $hasPriority,
        'paymentMethod' => $paymentMethod,
        'totalUsd' => $totalUsd,
        'totalCop' => $totalCop,
        'advertiserEmail' => $data['advertiserEmail'] ?? '',
        'advertiserPhone' => $data['advertiserPhone'] ?? '',
        'status' => 'ACTIVE',
        'createdAt' => date('Y-m-d H:i:s'),
        'assignedSlotMinute' => (int)date('i')
    ];

    $campaigns = getStoredJson($campaignsFile);
    $campaigns[] = $newCampaign;
    saveStoredJson($campaignsFile, $campaigns);

    // Configuración y URLs de PayPal Website Payments y PayPal.Me
    $paypalEmail = $pricingData['paypalMerchantEmail'] ?? 'alexis.tarrifa@gmail.com';
    $paypalMerchantId = $pricingData['paypalMerchantId'] ?? '6L4ZTMT48MEEL';
    $paypalMeUser = $pricingData['paypalMeUsername'] ?? 'alexistarrifa';
    $paypalCurrency = $pricingData['paypalCurrency'] ?? 'USD';

    $paypalParams = [
        'cmd' => '_xclick',
        'business' => $paypalMerchantId ?: $paypalEmail,
        'item_name' => "CareTech Games - Anuncio {$newCampaign['brandName']} ({$planId})",
        'item_number' => $campaignId,
        'amount' => number_format($totalUsd, 2, '.', ''),
        'currency_code' => $paypalCurrency,
        'no_shipping' => '1',
        'no_note' => '0',
        'charset' => 'utf-8',
        'custom' => $campaignId,
        'invoice' => $campaignId,
        'return' => 'https://caretechservices.com/games/publicidad/?payment=success&id=' . urlencode($campaignId),
        'cancel_return' => 'https://caretechservices.com/games/publicidad/?payment=cancel&id=' . urlencode($campaignId),
        'notify_url' => 'https://caretechservices.com/games/api.php?action=paypal_ipn'
    ];
    $paypalMeUrl = 'https://www.paypal.com/paypalme/' . rawurlencode($paypalMeUser) . '/' . number_format($totalUsd, 2, '.', '') . 'USD';
    
    // Prioridad 1: Orden oficial PayPal REST API v2 (CheckoutNow con soporte de tarjetas internacionales)
    // Prioridad 2: PayPal.Me directo sin error de carrito
    $restOrderUrl = getPayPalRestOrderUrl($totalUsd, $campaignId, $newCampaign['brandName'], $planId, $pricingData, $privatePaypalConfig);
    $paypalCheckoutUrl = $restOrderUrl ?: $paypalMeUrl;

    // Configuración ePayco para la campaña
    $epaycoPublicKey = $epaycoConfig['publicKey'] ?? '';
    $epaycoTestMode = !empty($epaycoConfig['testMode']);
    $epaycoCheckoutData = [
        'key' => $epaycoPublicKey,
        'test' => $epaycoTestMode,
        'name' => "CareTech Publicidad - {$newCampaign['brandName']}",
        'description' => "Plan {$planId} en CareTech Games",
        'invoice' => $campaignId,
        'currency' => 'cop',
        'amount' => (string)round($totalCop),
        'tax_base' => '0',
        'tax' => '0',
        'country' => 'co',
        'lang' => 'es',
        'external' => 'false',
        'extra1' => $campaignId,
        'extra2' => $planId,
        'confirmation' => $epaycoConfig['confirmationUrl'] ?? 'https://caretechservices.com/api.php?action=epayco_confirm',
        'response' => $epaycoConfig['responseUrl'] ?? 'https://caretechservices.com/pagos/respuesta/',
        'name_billing' => $newCampaign['brandName'],
        'email_billing' => $newCampaign['advertiserEmail'],
        'mobilephone_billing' => $newCampaign['advertiserPhone']
    ];

    // Configuración Mercado Pago para la campaña
    $mpSoloPlanId = $mercadopagoConfig['soloPlanId'] ?? 'ef5d45af5bd347a7830da2fbec0ea42d';
    $mpSoloPlanUrl = $mercadopagoConfig['soloPlanCheckoutUrl'] ?? "https://www.mercadopago.com.co/subscriptions/checkout?preapproval_plan_id={$mpSoloPlanId}";

    // Registrar en payments.json también para unificación
    $payments = getStoredJson($paymentsFile);
    $payments[] = [
        'reference' => $campaignId,
        'service' => 'publicidad',
        'brandName' => $newCampaign['brandName'],
        'planId' => $planId,
        'amountUsd' => $totalUsd,
        'amountCop' => $totalCop,
        'customerEmail' => $newCampaign['advertiserEmail'],
        'customerPhone' => $newCampaign['advertiserPhone'],
        'paymentMethod' => $paymentMethod,
        'status' => 'PENDING',
        'createdAt' => date('Y-m-d H:i:s')
    ];
    saveStoredJson($paymentsFile, $payments);

    echo json_encode([
        'success' => true,
        'message' => 'Campaña registrada y conectada exitosamente a CareTech Games.',
        'campaign' => $newCampaign,
        'checkout' => [
            'totalUsd' => $totalUsd,
            'totalCop' => $totalCop,
            'reference' => $campaignId,
            'paymentMethod' => $paymentMethod,
            'paypalMerchantEmail' => $paypalEmail,
            'paypalMerchantId' => $paypalMerchantId,
            'paypalMeUrl' => $paypalMeUrl,
            'paypalCurrency' => $paypalCurrency,
            'paypalCheckoutUrl' => $paypalCheckoutUrl,
            'paypalParams' => $paypalParams,
            'epayco' => $epaycoCheckoutData,
            'mercadopago' => [
                'soloPlanId' => $mpSoloPlanId,
                'soloPlanCheckoutUrl' => $mpSoloPlanUrl
            ],
            'binancePayQr' => 'https://pay.binance.com/qr/' . $campaignId,
            'unifiedPortalUrl' => 'https://caretechservices.com/pagos/?service=publicidad&plan=' . urlencode($planId) . '&ref=' . urlencode($campaignId)
        ]
    ]);
    exit;
}

// ==============================================================================
// 5. POST /api.php?action=paypal_ipn (PayPal Instant Payment Notification)
// Configuración en: https://www.paypal.com/businessmanage/account/website
// ==============================================================================
if (($action === 'paypal_ipn' || strpos($requestUri, '/paypal/ipn') !== false || strpos($requestUri, '/payments/paypal/ipn') !== false) && $method === 'POST') {
    $rawPost = file_get_contents('php://input');
    $rawPostArray = explode('&', $rawPost);
    $myPost = [];
    foreach ($rawPostArray as $keyval) {
        $keyval = explode('=', $keyval);
        if (count($keyval) === 2) {
            $myPost[$keyval[0]] = urldecode($keyval[1]);
        }
    }

    $req = 'cmd=_notify-validate';
    foreach ($myPost as $key => $value) {
        $req .= '&' . $key . '=' . urlencode($value);
    }

    $paypalHost = 'https://ipnpb.paypal.com/cgi-bin/webscr';
    $ch = curl_init($paypalHost);
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $req);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    curl_setopt($ch, CURLOPT_FORBID_REUSE, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['User-Agent: PHP-IPN-CareTech', 'Connection: Close']);
    $res = curl_exec($ch);
    curl_close($ch);

    $customId = $_POST['custom'] ?? $_POST['invoice'] ?? $_POST['item_number'] ?? '';
    $paymentStatus = $_POST['payment_status'] ?? '';

    if (strcmp($res, "VERIFIED") == 0 || $paymentStatus === 'Completed') {
        if (!empty($customId)) {
            $campaigns = getStoredJson($campaignsFile);
            foreach ($campaigns as &$c) {
                if (($c['id'] ?? '') === $customId) {
                    $c['status'] = 'ACTIVE';
                    $c['paymentStatus'] = 'PAID';
                    $c['paypalTxId'] = $_POST['txn_id'] ?? '';
                    $c['paidAt'] = date('Y-m-d H:i:s');
                    break;
                }
            }
            saveStoredJson($campaignsFile, $campaigns);
        }
    }

    http_response_code(200);
    echo "IPN_HANDLED";
    exit;
}

// ==============================================================================
// 6. PORTAL UNIFICADO DE PAGOS - ENDPOINTS API
// ==============================================================================

// 6.1. GET /api.php?action=payments_config (Configuración pública de pasarelas)
if (($action === 'payments_config' || strpos($requestUri, '/api/v1/payments/config') !== false) && $method === 'GET') {
    header('Content-Type: application/json');
    $epaycoPub = $epaycoConfig['publicKey'] ?? '';
    $mpSoloId = $mercadopagoConfig['soloPlanId'] ?? 'ef5d45af5bd347a7830da2fbec0ea42d';
    $mpSoloUrl = $mercadopagoConfig['soloPlanCheckoutUrl'] ?? "https://www.mercadopago.com.co/subscriptions/checkout?preapproval_plan_id={$mpSoloId}";

    echo json_encode([
        'success' => true,
        'countryDetected' => getDetectedCountry(),
        'exchangeRate' => [
            'copPerUsd' => (float)($pricingData['copExchangeRate'] ?? 4000),
            'currency' => 'USD'
        ],
        'gateways' => [
            'epayco' => [
                'name' => 'ePayco (PSE, Nequi, Daviplata, Tarjetas Colombia, Efecty)',
                'configured' => !empty($epaycoPub),
                'publicKey' => $epaycoPub,
                'testMode' => !empty($epaycoConfig['testMode']),
                'dashboardUrl' => $epaycoConfig['dashboardUrl'] ?? 'https://dashboard.epayco.com/dashboard',
                'pCustIdCliente' => $epaycoConfig['pCustIdCliente'] ?? '',
                'responseUrl' => $epaycoConfig['responseUrl'] ?? 'https://caretechservices.com/pagos/respuesta/'
            ],
            'mercadopago' => [
                'name' => 'Mercado Pago (Suscripción Plan Solo, Cuotas y Dinero MP)',
                'configured' => true,
                'soloPlanId' => $mpSoloId,
                'soloPlanCheckoutUrl' => $mpSoloUrl,
                'hasCustomKey' => !empty($mercadopagoConfig['publicKey'])
            ],
            'paypal' => [
                'name' => 'PayPal & Tarjetas Internacionales (USD)',
                'configured' => !empty($privatePaypalConfig['clientId']),
                'clientId' => $privatePaypalConfig['clientId'] ?? '',
                'mode' => $privatePaypalConfig['mode'] ?? 'live',
                'merchantEmail' => $privatePaypalConfig['merchantEmail'] ?? 'alexis.tarrifa@gmail.com',
                'meUsername' => $privatePaypalConfig['meUsername'] ?? 'alexistarrifa'
            ],
            'binancePay' => [
                'name' => 'Binance Pay (Criptomonedas USDT 0% fee)',
                'configured' => !empty($privatePaymentsConfig['binancePay']['apiKey'])
            ]
        ]
    ]);
    exit;
}

// 6.1.1. POST /api.php?action=save_epayco_config (Guardar llaves ePayco obtenidas del Dashboard oficial)
if (($action === 'save_epayco_config' || strpos($requestUri, '/api/v1/payments/epayco/save-config') !== false) && $method === 'POST') {
    header('Content-Type: application/json');
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];

    $newPubKey   = trim($data['publicKey'] ?? '');
    $newPrivKey  = trim($data['privateKey'] ?? '');
    $newPKey     = trim($data['pKey'] ?? '');
    $newCustId   = trim($data['pCustIdCliente'] ?? '');
    $testMode    = !empty($data['testMode']);

    if (empty($newPubKey)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'La PUBLIC_KEY de ePayco es obligatoria']);
        exit;
    }

    // Ubicacion del archivo privado
    $targetPath = null;
    foreach ($possiblePrivateDirs as $privDir) {
        if ($privDir && is_dir($privDir)) {
            $targetPath = $privDir . '/payments.php';
            break;
        }
    }
    if (!$targetPath) {
        $targetPath = dirname(__DIR__, 2) . '/caretech-private/payments.php';
    }

    $existing = is_array($privatePaymentsConfig) ? $privatePaymentsConfig : [];
    $existing['currency'] = $existing['currency'] ?? 'USD';
    $existing['copExchangeRate'] = $existing['copExchangeRate'] ?? 4000;
    
    $existing['epayco'] = [
        'pCustIdCliente' => $newCustId ?: ($existing['epayco']['pCustIdCliente'] ?? ''),
        'publicKey'      => $newPubKey,
        'privateKey'     => $newPrivKey ?: ($existing['epayco']['privateKey'] ?? ''),
        'pKey'           => $newPKey ?: ($existing['epayco']['pKey'] ?? ''),
        'testMode'       => $testMode,
        'dashboardUrl'   => 'https://dashboard.epayco.com/dashboard',
        'confirmationUrl'=> 'https://caretechservices.com/api.php?action=epayco_confirm',
        'responseUrl'    => 'https://caretechservices.com/pagos/respuesta/'
    ];

    $existing['mercadopago'] = $existing['mercadopago'] ?? [
        'soloPlanId' => 'ef5d45af5bd347a7830da2fbec0ea42d',
        'soloPlanCheckoutUrl' => 'https://www.mercadopago.com.co/subscriptions/checkout?preapproval_plan_id=ef5d45af5bd347a7830da2fbec0ea42d',
        'publicKey' => '',
        'accessToken' => '',
        'webhookUrl' => 'https://caretechservices.com/api.php?action=mercadopago_ipn'
    ];

    $existing['paypal'] = $existing['paypal'] ?? [
        'mode' => 'live',
        'clientId' => 'BAAqqtlAVEAYcI4HczDkLgzyejjP8NInCX8DojUaNHOLrpkdMB9nXNTClEUTSrNqzpDR76fc7T7HWPUEjU',
        'clientSecret' => 'EAyLUNFbJjUEIsfp7_uayQLPwl-QYngT2279hqh1SCkrMJTcMffhPLOp64k1QT5dIkYpdVHl_7-riCNK',
        'merchantEmail' => 'alexis.tarrifa@gmail.com',
        'merchantId' => '6L4ZTMT48MEEL',
        'meUsername' => 'alexistarrifa'
    ];

    $exportContent = "<?php\n/**\n * CareTech Services - Private Payments Configuration\n */\nreturn " . var_export($existing, true) . ";\n";
    @file_put_contents($targetPath, $exportContent);
    @chmod($targetPath, 0600);

    echo json_encode([
        'success' => true,
        'message' => 'Llaves ePayco actualizadas exitosamente en modo ' . ($testMode ? 'Pruebas' : 'Producción (En vivo)'),
        'publicKey' => $newPubKey,
        'testMode' => $testMode
    ]);
    exit;
}

// 6.2. POST /api.php?action=create_payment (Crear orden unificada de pago)
if (($action === 'create_payment' || strpos($requestUri, '/api/v1/payments/create') !== false) && $method === 'POST') {
    header('Content-Type: application/json');
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];

    $service = $data['service'] ?? 'donar'; // donar, publicidad, plan_solo, loyalty, custom
    $currency = strtoupper($data['currency'] ?? 'USD');
    $rawAmount = floatval($data['amount'] ?? 0);
    $gateway = strtolower($data['gateway'] ?? 'epayco'); // epayco, mercadopago, paypal, binance, auto
    $rate = floatval($pricingData['copExchangeRate'] ?? 4000);

    if ($rawAmount <= 0) {
        $rawAmount = ($service === 'donar') ? 5.00 : (($service === 'plan_solo') ? 9.90 : 1.00);
    }

    if ($currency === 'COP') {
        $amountCop = $rawAmount;
        $amountUsd = round($amountCop / $rate, 2);
    } else {
        $amountUsd = $rawAmount;
        $amountCop = round($amountUsd * $rate);
    }

    $refPrefix = strtoupper(substr($service, 0, 4));
    $reference = 'PAY_' . $refPrefix . '_' . time() . '_' . rand(1000, 9999);

    $customer = $data['customer'] ?? [];
    $customerName = trim($customer['name'] ?? $data['name'] ?? 'Usuario CareTech');
    $customerEmail = trim($customer['email'] ?? $data['email'] ?? '');
    $customerPhone = trim($customer['phone'] ?? $data['phone'] ?? '');
    $customerDoc = trim($customer['document'] ?? $data['document'] ?? '');

    $description = $data['description'] ?? ("CareTech Services - " . ucfirst($service) . " (" . $reference . ")");
    if ($service === 'donar') {
        $description = "Donación Comunitaria CareTech Games - Estimulación Cognitiva y SOS";
    } elseif ($service === 'plan_solo') {
        $description = "Suscripción Plan Solo CareTech (Mercado Pago)";
    } elseif ($service === 'publicidad') {
        $description = "Publicidad y Patrocinio CareTech Games (" . ($data['metadata']['planId'] ?? 'Campaña') . ")";
    }

    $paymentRecord = [
        'reference' => $reference,
        'service' => $service,
        'gateway' => $gateway,
        'currency' => $currency,
        'amountUsd' => $amountUsd,
        'amountCop' => $amountCop,
        'description' => $description,
        'customer' => [
            'name' => $customerName,
            'email' => $customerEmail,
            'phone' => $customerPhone,
            'document' => $customerDoc
        ],
        'metadata' => $data['metadata'] ?? [],
        'status' => 'PENDING',
        'createdAt' => date('Y-m-d H:i:s'),
        'countryDetected' => getDetectedCountry()
    ];

    $payments = getStoredJson($paymentsFile);
    $payments[] = $paymentRecord;
    saveStoredJson($paymentsFile, $payments);

    // Preparar payloads específicos de cada pasarela
    $epaycoPub = $epaycoConfig['publicKey'] ?? '';
    $epaycoData = [
        'key' => $epaycoPub,
        'test' => !empty($epaycoConfig['testMode']),
        'name' => $description,
        'description' => $description,
        'invoice' => $reference,
        'currency' => 'cop',
        'amount' => (string)$amountCop,
        'tax_base' => '0',
        'tax' => '0',
        'country' => 'co',
        'lang' => 'es',
        'external' => 'false',
        'extra1' => $reference,
        'extra2' => $service,
        'confirmation' => $epaycoConfig['confirmationUrl'] ?? 'https://caretechservices.com/api.php?action=epayco_confirm',
        'response' => $epaycoConfig['responseUrl'] ?? 'https://caretechservices.com/pagos/respuesta/',
        'name_billing' => $customerName,
        'email_billing' => $customerEmail,
        'mobilephone_billing' => $customerPhone,
        'number_doc_billing' => $customerDoc
    ];

    $mpSoloId = $mercadopagoConfig['soloPlanId'] ?? 'ef5d45af5bd347a7830da2fbec0ea42d';
    $mpSoloUrl = $mercadopagoConfig['soloPlanCheckoutUrl'] ?? "https://www.mercadopago.com.co/subscriptions/checkout?preapproval_plan_id={$mpSoloId}";

    $paypalMeUser = $privatePaypalConfig['meUsername'] ?? 'alexistarrifa';
    $paypalMeUrl = 'https://www.paypal.com/paypalme/' . rawurlencode($paypalMeUser) . '/' . number_format($amountUsd, 2, '.', '') . 'USD';

    echo json_encode([
        'success' => true,
        'reference' => $reference,
        'service' => $service,
        'amountUsd' => $amountUsd,
        'amountCop' => $amountCop,
        'description' => $description,
        'gateways' => [
            'epayco' => $epaycoData,
            'mercadopago' => [
                'soloPlanId' => $mpSoloId,
                'soloPlanCheckoutUrl' => $mpSoloUrl
            ],
            'paypal' => [
                'paypalMeUrl' => $paypalMeUrl,
                'amountUsd' => $amountUsd
            ],
            'binancePay' => [
                'qrUrl' => 'https://pay.binance.com/qr/' . $reference,
                'amountUsdt' => $amountUsd
            ]
        ],
        'receiptUrl' => 'https://caretechservices.com/pagos/respuesta/?ref=' . urlencode($reference)
    ]);
    exit;
}

// 6.3. POST/GET /api.php?action=epayco_confirm (Webhook ePayco con validación de firma SHA-256)
if ($action === 'epayco_confirm' || strpos($requestUri, '/api/v1/payments/epayco/webhook') !== false) {
    $src = ($_SERVER['REQUEST_METHOD'] === 'POST') ? $_POST : $_GET;
    if (empty($src)) {
        $raw = file_get_contents('php://input');
        $src = json_decode($raw, true) ?: [];
    }

    $refPayco     = $src['x_ref_payco'] ?? '';
    $txId         = $src['x_transaction_id'] ?? '';
    $amount       = $src['x_amount'] ?? '';
    $currencyCode = $src['x_currency_code'] ?? 'COP';
    $signature    = $src['x_signature'] ?? '';
    $codResponse  = intval($src['x_cod_response'] ?? 0);
    $responseMsg  = $src['x_response'] ?? '';
    $invoiceRef   = $src['x_extra1'] ?? $src['x_id_invoice'] ?? '';

    // Mapear código de respuesta ePayco:
    // 1: Aceptada | 2: Rechazada | 3: Pendiente | 4: Fallida / Reversada
    $newStatus = 'PENDING';
    if ($codResponse === 1) {
        $newStatus = 'PAID';
    } elseif ($codResponse === 3) {
        $newStatus = 'PENDING';
    } elseif ($codResponse === 2 || $codResponse === 4) {
        $newStatus = 'REJECTED';
    }

    // Validar firma si P_KEY y P_CUST_ID están configurados
    $pCustId = $epaycoConfig['pCustIdCliente'] ?? '';
    $pKey    = $epaycoConfig['pKey'] ?? '';
    $isValidSig = true;
    if (!empty($pCustId) && !empty($pKey) && !empty($signature)) {
        $calculatedSig = hash('sha256', "{$pCustId}^{$pKey}^{$refPayco}^{$txId}^{$amount}^{$currencyCode}");
        if (strcasecmp($calculatedSig, $signature) !== 0) {
            $isValidSig = false;
        }
    }

    // Actualizar registro en payments.json
    $payments = getStoredJson($paymentsFile);
    $found = false;
    foreach ($payments as &$p) {
        if (($p['reference'] ?? '') === $invoiceRef || ($p['epaycoRef'] ?? '') === $refPayco) {
            $p['status'] = $newStatus;
            $p['epaycoRef'] = $refPayco;
            $p['epaycoTxId'] = $txId;
            $p['epaycoResponse'] = $responseMsg;
            $p['paidAt'] = ($newStatus === 'PAID') ? date('Y-m-d H:i:s') : ($p['paidAt'] ?? null);
            $found = true;
            break;
        }
    }
    if ($found) {
        saveStoredJson($paymentsFile, $payments);
    }

    // Si coincide con una campaña publicitaria, actualizarla
    if (!empty($invoiceRef)) {
        $campaigns = getStoredJson($campaignsFile);
        $campFound = false;
        foreach ($campaigns as &$c) {
            if (($c['id'] ?? '') === $invoiceRef) {
                if ($newStatus === 'PAID') {
                    $c['status'] = 'ACTIVE';
                    $c['paymentStatus'] = 'PAID';
                    $c['paidAt'] = date('Y-m-d H:i:s');
                    $c['epaycoRef'] = $refPayco;
                }
                $campFound = true;
                break;
            }
        }
        if ($campFound) {
            saveStoredJson($campaignsFile, $campaigns);
        }
    }

    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'ePayco confirmation processed successfully',
        'reference' => $invoiceRef,
        'status' => $newStatus,
        'sigVerified' => $isValidSig
    ]);
    exit;
}

// 6.4. POST/GET /api.php?action=mercadopago_ipn (Webhook Mercado Pago)
if ($action === 'mercadopago_ipn' || strpos($requestUri, '/api/v1/payments/mercadopago/webhook') !== false) {
    $src = ($_SERVER['REQUEST_METHOD'] === 'POST') ? $_POST : $_GET;
    if (empty($src)) {
        $raw = file_get_contents('php://input');
        $src = json_decode($raw, true) ?: [];
    }

    $mpType = $src['type'] ?? $src['topic'] ?? '';
    $mpId   = $src['data']['id'] ?? $src['id'] ?? '';
    $externalRef = $src['external_reference'] ?? '';

    if (!empty($externalRef)) {
        $payments = getStoredJson($paymentsFile);
        foreach ($payments as &$p) {
            if (($p['reference'] ?? '') === $externalRef) {
                $p['status'] = 'PAID';
                $p['mercadopagoId'] = $mpId;
                $p['paidAt'] = date('Y-m-d H:i:s');
                break;
            }
        }
        saveStoredJson($paymentsFile, $payments);
    }

    http_response_code(200);
    echo "MP_NOTIFICATION_RECEIVED";
    exit;
}

// 6.5. GET /api.php?action=payment_status (Consultar estado de transacción)
if ($action === 'payment_status' || strpos($requestUri, '/api/v1/payments/status') !== false) {
    header('Content-Type: application/json');
    $ref = $_GET['reference'] ?? $_GET['ref'] ?? $_GET['invoice'] ?? $_GET['ref_payco'] ?? '';

    if (empty($ref)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Referencia no especificada']);
        exit;
    }

    $payments = getStoredJson($paymentsFile);
    $matched = null;
    foreach ($payments as $p) {
        if (($p['reference'] ?? '') === $ref || ($p['epaycoRef'] ?? '') === $ref || ($p['metadata']['campaignId'] ?? '') === $ref) {
            $matched = $p;
            break;
        }
    }

    // Fallback: buscar en campañas
    if (!$matched) {
        $campaigns = getStoredJson($campaignsFile);
        foreach ($campaigns as $c) {
            if (($c['id'] ?? '') === $ref) {
                $matched = [
                    'reference' => $c['id'],
                    'service' => 'publicidad',
                    'status' => ($c['paymentStatus'] ?? '') === 'PAID' ? 'PAID' : ($c['status'] ?? 'PENDING'),
                    'amountUsd' => $c['totalUsd'] ?? 0,
                    'amountCop' => $c['totalCop'] ?? 0,
                    'description' => "Publicidad CareTech - " . ($c['brandName'] ?? ''),
                    'customer' => ['name' => $c['brandName'] ?? '', 'email' => $c['advertiserEmail'] ?? ''],
                    'paidAt' => $c['paidAt'] ?? null,
                    'createdAt' => $c['createdAt'] ?? null
                ];
                break;
            }
        }
    }

    if ($matched) {
        echo json_encode([
            'success' => true,
            'payment' => $matched
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'payment' => [
                'reference' => $ref,
                'status' => 'PENDING',
                'service' => 'general',
                'description' => 'Transacción en proceso de verificación'
            ]
        ]);
    }
    exit;
}

// Default Health Ping
header('Content-Type: application/json');
echo json_encode([
    'platform' => 'CareTech Games Platform V2',
    'status' => 'OK',
    'countryDetected' => getDetectedCountry(),
    'time' => time()
]);

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
$campaignsFile = $dataDir . '/campaigns.json';
$analyticsFile = $dataDir . '/analytics.json';
$devicesFile   = $dataDir . '/devices.json';

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

// Load Private PayPal Configuration (strictly located outside public_html in caretech-private/)
$privatePaypalConfig = null;
$possiblePrivatePaths = [
    dirname(__DIR__, 2) . '/caretech-private/paypal.php',
    dirname(__DIR__, 3) . '/caretech-private/paypal.php',
    __DIR__ . '/../../caretech-private/paypal.php',
    __DIR__ . '/../../../caretech-private/paypal.php',
    isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] . '/../caretech-private/paypal.php' : null
];
foreach ($possiblePrivatePaths as $privPath) {
    if ($privPath && file_exists($privPath)) {
        $loadedConfig = @include $privPath;
        if (is_array($loadedConfig)) {
            $privatePaypalConfig = $loadedConfig;
            break;
        }
    }
}

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
    $publicPricing = $pricingData;
    unset($publicPricing['paypalClientSecret']);
    unset($publicPricing['paypalClientId']);
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
            'binancePayQr' => 'https://pay.binance.com/qr/' . $campaignId
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

// Default Health Ping
header('Content-Type: application/json');
echo json_encode([
    'platform' => 'CareTech Games Platform V2',
    'status' => 'OK',
    'countryDetected' => getDetectedCountry(),
    'time' => time()
]);

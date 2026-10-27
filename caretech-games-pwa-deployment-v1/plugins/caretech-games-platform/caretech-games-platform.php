<?php
/**
 * Plugin Name: CareTech Games Platform & Ads System
 * Plugin URI: https://caretechservices.com/games/
 * Description: Sistema unificado de publicidad, registro anónimo de dispositivos y telemetría para CareTech Games PWA.
 * Version: 1.0.0
 * Author: CareTech Services
 * Author URI: https://caretechservices.com
 * Text Domain: caretech-games-platform
 */

if (!defined('ABSPATH')) {
    exit;
}

class CareTechGamesPlatformPlugin {
    const REST_NAMESPACE = 'careads/v1';

    public function __construct() {
        register_activation_hook(__FILE__, [$this, 'activatePlugin']);
        add_action('rest_api_init', [$this, 'registerRestRoutes']);
        add_action('admin_menu', [$this, 'addAdminMenu']);
    }

    public function activatePlugin() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        // 1. Devices Table
        $table_devices = $wpdb->prefix . 'care_game_devices';
        $sql_devices = "CREATE TABLE IF NOT EXISTS $table_devices (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            game_id varchar(64) NOT NULL,
            install_id_hash varchar(64) NOT NULL UNIQUE,
            first_activation tinyint(1) DEFAULT 1,
            standalone tinyint(1) DEFAULT 0,
            ua_class varchar(32) DEFAULT 'desktop',
            country varchar(8) DEFAULT 'CO',
            registered_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY game_country (game_id, country)
        ) $charset_collate;";

        // 2. Events / Telemetry Table
        $table_events = $wpdb->prefix . 'care_game_events';
        $sql_events = "CREATE TABLE IF NOT EXISTS $table_events (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            game_id varchar(64) NOT NULL,
            campaign_id varchar(64) DEFAULT NULL,
            event_type varchar(64) NOT NULL,
            placement varchar(32) DEFAULT 'top',
            country varchar(8) DEFAULT 'CO',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY game_evt (game_id, event_type)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_devices);
        dbDelta($sql_events);
    }

    public function registerRestRoutes() {
        // GET /wp-json/careads/v1/banners
        register_rest_route(self::REST_NAMESPACE, '/banners', [
            'methods' => 'GET',
            'callback' => [$this, 'handleGetBanners'],
            'permission_callback' => '__return_true'
        ]);

        // POST /wp-json/careads/v1/install/activate
        register_rest_route(self::REST_NAMESPACE, '/install/activate', [
            'methods' => 'POST',
            'callback' => [$this, 'handleActivateDevice'],
            'permission_callback' => '__return_true'
        ]);

        // POST /wp-json/careads/v1/events/batch
        register_rest_route(self::REST_NAMESPACE, '/events/batch', [
            'methods' => 'POST',
            'callback' => [$this, 'handleBatchEvents'],
            'permission_callback' => '__return_true'
        ]);
    }

    private function getDetectedCountry() {
        return $_SERVER['HTTP_CF_IPCOUNTRY'] ??
               $_SERVER['HTTP_X_COUNTRY_CODE'] ??
               $_SERVER['GEOIP_COUNTRY_CODE'] ??
               'CO';
    }

    public function handleGetBanners($request) {
        $game = sanitize_text_field($request->get_param('game') ?: 'solitario');
        $placement = sanitize_text_field($request->get_param('placement') ?: 'top');
        $currentMinute = (int)date('i');

        $etag = md5("care_wp_{$game}_{$placement}_{$currentMinute}");
        header("ETag: \"{$etag}\"");
        header("Cache-Control: public, max-age=60");

        if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH'], '"') === $etag) {
            return new WP_REST_Response(null, 304);
        }

        if ($placement === 'top') {
            $banner = [
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
            ];
        } else {
            $banner = [
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
            ];
        }

        return rest_ensure_response($banner);
    }

    public function handleActivateDevice($request) {
        global $wpdb;
        $params = $request->get_json_params() ?: [];

        $game_id = sanitize_text_field($params['gameId'] ?? 'solitario');
        $hash = sanitize_text_field($params['installIdHash'] ?? '');
        $first = !empty($params['firstActivation']) ? 1 : 0;
        $standalone = !empty($params['standalone']) ? 1 : 0;
        $ua_class = sanitize_text_field($params['uaClass'] ?? 'desktop');
        $country = $this->getDetectedCountry();

        if (!empty($hash)) {
            $table = $wpdb->prefix . 'care_game_devices';
            $wpdb->replace($table, [
                'game_id' => $game_id,
                'install_id_hash' => $hash,
                'first_activation' => $first,
                'standalone' => $standalone,
                'ua_class' => $ua_class,
                'country' => $country,
                'registered_at' => current_time('mysql')
            ], ['%s', '%s', '%d', '%d', '%s', '%s', '%s']);
        }

        return rest_ensure_response([
            'success' => true,
            'countryDetected' => $country,
            'message' => 'Device activation registered'
        ]);
    }

    public function handleBatchEvents($request) {
        global $wpdb;
        $params = $request->get_json_params() ?: [];
        $events = $params['events'] ?? [];
        $country = $this->getDetectedCountry();

        if (is_array($events) && !empty($events)) {
            $table = $wpdb->prefix . 'care_game_events';
            foreach ($events as $e) {
                $wpdb->insert($table, [
                    'game_id' => sanitize_text_field($e['gameId'] ?? 'solitario'),
                    'campaign_id' => sanitize_text_field($e['campaignId'] ?? ''),
                    'event_type' => sanitize_text_field($e['eventType'] ?? 'ad_impression'),
                    'placement' => sanitize_text_field($e['placement'] ?? 'top'),
                    'country' => $country,
                    'created_at' => current_time('mysql')
                ], ['%s', '%s', '%s', '%s', '%s', '%s']);
            }
        }

        return rest_ensure_response([
            'success' => true,
            'countryDetected' => $country,
            'recorded' => count($events)
        ]);
    }

    public function addAdminMenu() {
        add_menu_page(
            'CareTech Games',
            'Care Games',
            'manage_options',
            'caretech-games',
            [$this, 'renderAdminPage'],
            'dashicons-games',
            30
        );
    }

    public function renderAdminPage() {
        echo '<div class="wrap">';
        echo '<h1>CareTech Games Platform</h1>';
        echo '<p>Plataforma activa para portal y juegos PWA (/games/solitario/).</p>';
        echo '<p><a href="/games/admin/" class="button button-primary" target="_blank">Abrir Panel de Publicidad</a></p>';
        echo '</div>';
    }
}

new CareTechGamesPlatformPlugin();

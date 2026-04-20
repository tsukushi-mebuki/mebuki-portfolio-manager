<?php
/**
 * Deterministic WordPress config for local/CI Docker E2E.
 * Keep this aligned with docker-compose.yml wordpress/db services.
 */
define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', 'wordpress' );
define( 'DB_PASSWORD', 'wordpress' );
define( 'DB_HOST', 'db:3306' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY',         'mebuki-e2e-auth-key' );
define( 'SECURE_AUTH_KEY',  'mebuki-e2e-secure-auth-key' );
define( 'LOGGED_IN_KEY',    'mebuki-e2e-logged-in-key' );
define( 'NONCE_KEY',        'mebuki-e2e-nonce-key' );
define( 'AUTH_SALT',        'mebuki-e2e-auth-salt' );
define( 'SECURE_AUTH_SALT', 'mebuki-e2e-secure-auth-salt' );
define( 'LOGGED_IN_SALT',   'mebuki-e2e-logged-in-salt' );
define( 'NONCE_SALT',       'mebuki-e2e-nonce-salt' );

$table_prefix = 'wp_';
define( 'WP_DEBUG', false );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';

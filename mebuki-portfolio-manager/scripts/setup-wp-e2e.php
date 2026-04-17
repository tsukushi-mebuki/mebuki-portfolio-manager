<?php
/**
 * CI helper: install WordPress (if needed), activate plugin, and prepare E2E page.
 *
 * Do not define WP_INSTALLING here: leaving it true after the site is installed
 * can break rewrites, shortcodes, and other runtime behavior during this script.
 */

$site_url = getenv( 'E2E_BASE_URL' ) ?: 'http://localhost:8000';

// CLI で wp-load する前に必須。未定義だと wp-includes 内で HTTP_HOST 警告・URL 推測が壊れる。
if ( 'cli' === PHP_SAPI ) {
	$parsed = parse_url( $site_url );
	if ( is_array( $parsed ) && ! empty( $parsed['host'] ) ) {
		$host = $parsed['host'];
		if ( ! empty( $parsed['port'] ) ) {
			$host .= ':' . $parsed['port'];
		}
		$_SERVER['HTTP_HOST']   = $host;
		$_SERVER['HTTPS']       = ( isset( $parsed['scheme'] ) && 'https' === $parsed['scheme'] ) ? 'on' : 'off';
		$_SERVER['SERVER_NAME'] = $parsed['host'];
		$_SERVER['REQUEST_URI'] = '/';
		if ( ! empty( $parsed['port'] ) ) {
			$_SERVER['SERVER_PORT'] = (string) (int) $parsed['port'];
		} else {
			$_SERVER['SERVER_PORT'] = ( isset( $parsed['scheme'] ) && 'https' === $parsed['scheme'] ) ? '443' : '80';
		}
	}
}

require '/var/www/html/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/upgrade.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';
require_once ABSPATH . 'wp-admin/includes/user.php';

$site_title     = 'Mebuki E2E Site';
$admin_user     = getenv( 'E2E_ADMIN_USER' ) ?: 'admin';
$admin_password = getenv( 'E2E_ADMIN_PASSWORD' ) ?: 'password';
$admin_email    = 'admin@example.com';

if ( ! is_blog_installed() ) {
	// 第7引数でロケールを固定（未インストール時の Web インストーラ言語画面とは別経路で完了させる）
	wp_install( $site_title, $admin_user, $admin_email, true, '', $admin_password, 'en_US' );
	global $wpdb;
	if ( $wpdb->last_error ) {
		fwrite( STDERR, 'wp_install DB error: ' . $wpdb->last_error . PHP_EOL );
		exit( 1 );
	}
}

if ( ! is_blog_installed() ) {
	fwrite( STDERR, "wp_install did not complete: is_blog_installed() is still false.\n" );
	exit( 1 );
}

$admin = get_user_by( 'login', $admin_user );
if ( ! $admin ) {
	$admin_id = wp_create_user( $admin_user, $admin_password, $admin_email );
	$admin    = get_user_by( 'id', $admin_id );
}
if ( $admin instanceof WP_User ) {
	$admin->set_role( 'administrator' );
	wp_set_password( $admin_password, $admin->ID );
	wp_set_current_user( $admin->ID );
}

if ( ! is_plugin_active( 'mebuki-portfolio-manager/mebuki-portfolio-manager.php' ) ) {
	$result = activate_plugin( 'mebuki-portfolio-manager/mebuki-portfolio-manager.php' );
	if ( is_wp_error( $result ) ) {
		fwrite( STDERR, 'Plugin activation failed: ' . $result->get_error_message() . PHP_EOL );
		exit( 1 );
	}
}

global $wp_rewrite;
update_option( 'permalink_structure', '/%postname%/' );
if ( $wp_rewrite instanceof WP_Rewrite ) {
	$wp_rewrite->set_permalink_structure( '/%postname%/' );
	$wp_rewrite->flush_rules( true );
}

$slug = 'portfolio-e2e';
$page = get_page_by_path( $slug, OBJECT, 'page' );
if ( ! $page ) {
	$new_id = wp_insert_post(
		array(
			'post_type'    => 'page',
			'post_title'   => 'Portfolio E2E',
			'post_name'    => $slug,
			'post_status'  => 'publish',
			'post_content' => '[mebuki_portfolio]',
		),
		true
	);
	if ( is_wp_error( $new_id ) ) {
		fwrite( STDERR, 'wp_insert_post failed: ' . $new_id->get_error_message() . PHP_EOL );
		exit( 1 );
	}
	if ( ! is_int( $new_id ) || $new_id <= 0 ) {
		fwrite( STDERR, "wp_insert_post did not return a valid page ID.\n" );
		exit( 1 );
	}
} else {
	$updated = wp_update_post(
		array(
			'ID'           => $page->ID,
			'post_status'  => 'publish',
			'post_content' => '[mebuki_portfolio]',
		),
		true
	);
	if ( is_wp_error( $updated ) ) {
		fwrite( STDERR, 'wp_update_post failed: ' . $updated->get_error_message() . PHP_EOL );
		exit( 1 );
	}
}

update_option( 'siteurl', $site_url );
update_option( 'home', $site_url );

// Align public portfolio owner with the E2E admin login (Docker may already have another administrator as user ID 1).
if ( $admin instanceof WP_User ) {
	update_option( 'mebuki_pm_portfolio_owner_user_id', (int) $admin->ID, false );
}

if ( function_exists( 'wp_cache_flush' ) ) {
	wp_cache_flush();
}

$page_verify = get_page_by_path( $slug, OBJECT, 'page' );
if ( ! $page_verify instanceof WP_Post || 'publish' !== $page_verify->post_status ) {
	fwrite( STDERR, "E2E portfolio page is missing or not published (slug: {$slug}).\n" );
	exit( 1 );
}
if ( false === strpos( (string) $page_verify->post_content, 'mebuki_portfolio' ) ) {
	fwrite( STDERR, "E2E portfolio page must contain the [mebuki_portfolio] shortcode.\n" );
	exit( 1 );
}

if ( ! is_plugin_active( 'mebuki-portfolio-manager/mebuki-portfolio-manager.php' ) ) {
	fwrite( STDERR, "Plugin mebuki-portfolio-manager is not active after setup.\n" );
	exit( 1 );
}

echo "E2E WordPress setup complete.\n";

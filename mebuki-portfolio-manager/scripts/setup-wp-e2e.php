<?php
/**
 * CI helper: install WordPress (if needed), activate plugin, and prepare E2E page.
 */

define( 'WP_INSTALLING', true );
require '/var/www/html/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/upgrade.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';
require_once ABSPATH . 'wp-admin/includes/user.php';

$site_url       = 'http://localhost:8000';
$site_title     = 'Mebuki E2E Site';
$admin_user     = getenv( 'E2E_ADMIN_USER' ) ?: 'admin';
$admin_password = getenv( 'E2E_ADMIN_PASSWORD' ) ?: 'password';
$admin_email    = 'admin@example.com';

if ( ! is_blog_installed() ) {
	wp_install( $site_title, $admin_user, $admin_email, true, '', $admin_password );
}

$admin = get_user_by( 'login', $admin_user );
if ( ! $admin ) {
	$admin_id = wp_create_user( $admin_user, $admin_password, $admin_email );
	$admin    = get_user_by( 'id', $admin_id );
}
if ( $admin instanceof WP_User ) {
	$admin->set_role( 'administrator' );
	wp_set_password( $admin_password, $admin->ID );
}

if ( ! is_plugin_active( 'mebuki-portfolio-manager/mebuki-portfolio-manager.php' ) ) {
	activate_plugin( 'mebuki-portfolio-manager/mebuki-portfolio-manager.php' );
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
	wp_insert_post(
		array(
			'post_type'    => 'page',
			'post_title'   => 'Portfolio E2E',
			'post_name'    => $slug,
			'post_status'  => 'publish',
			'post_content' => '[mebuki_portfolio]',
		)
	);
} else {
	wp_update_post(
		array(
			'ID'           => $page->ID,
			'post_status'  => 'publish',
			'post_content' => '[mebuki_portfolio]',
		)
	);
}

update_option( 'siteurl', $site_url );
update_option( 'home', $site_url );

echo "E2E WordPress setup complete.\n";

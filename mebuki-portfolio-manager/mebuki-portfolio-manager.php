<?php
/**
 * Plugin Name: Mebuki Portfolio Manager
 * Plugin URI: https://example.com/mebuki-works
 * Description: Mebuki Works core plugin for custom tables and REST-based portfolio management.
 * Version: 0.1.0
 * Author: Mebuki Works
 * Author URI: https://example.com
 * License: GPL-2.0-or-later
 * Text Domain: mebuki-portfolio-manager
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'MEBUKI_PM_FILE' ) ) {
	define( 'MEBUKI_PM_FILE', __FILE__ );
}

if ( ! defined( 'MEBUKI_PM_PATH' ) ) {
	define( 'MEBUKI_PM_PATH', plugin_dir_path( __FILE__ ) );
}

/**
 * Main plugin bootstrap.
 *
 * Manual loading keeps startup predictable and makes transition
 * to autoloading straightforward when classes increase.
 */
final class Mebuki_Portfolio_Manager {
	private const OPTION_PAGE_PORTFOLIO = 'mebuki_pm_page_portfolio';
	private const OPTION_PAGE_DASHBOARD = 'mebuki_pm_page_dashboard';
	private const OPTION_PAGE_REVIEWS   = 'mebuki_pm_page_reviews';
	private const SHORTCODE_CONTENT     = '[mebuki_portfolio]';

	/**
	 * Boot plugin runtime.
	 *
	 * @return void
	 */
	public static function init() {
		self::load_dependencies();
		self::ensure_roles_and_caps();
		add_action( 'rest_api_init', array( 'Mebuki_PM_API', 'register_routes' ) );
		add_filter( 'script_loader_tag', array( __CLASS__, 'script_loader_tag_module' ), 10, 3 );
		Mebuki_PM_Admin::init();
		Mebuki_PM_Frontend::init();
	}

	/**
	 * Vite emits ESM entrypoints (`import`); load as native modules in the browser.
	 *
	 * @param string $tag    Script HTML.
	 * @param string $handle Registered handle.
	 * @param string $src    Script source URL.
	 * @return string
	 */
	public static function script_loader_tag_module( $tag, $handle, $src ) {
		unset( $src );
		$module_handles = array(
			Mebuki_PM_Admin::VENDOR_HANDLE,
			Mebuki_PM_Admin::SETTINGS_CHUNK_HANDLE,
			Mebuki_PM_Admin::SCRIPT_HANDLE,
			Mebuki_PM_Frontend::SCRIPT_HANDLE,
		);
		if ( in_array( $handle, $module_handles, true ) ) {
			$tag = preg_replace( '/^<script\\s/i', '<script type="module" ', $tag, 1 );
		}
		return $tag;
	}

	/**
	 * Activation callback.
	 *
	 * @return void
	 */
	public static function activate() {
		self::load_dependencies();
		self::ensure_roles_and_caps();
		Mebuki_PM_DB::migrate();
		self::ensure_core_pages();
		Mebuki_PM_Frontend::register_rewrite_rules();
		flush_rewrite_rules();
	}

	/**
	 * Create core fixed pages if missing and keep shortcode content consistent.
	 *
	 * @return void
	 */
	private static function ensure_core_pages() {
		$pages = array(
			array(
				'slug'       => 'portfolio',
				'title'      => 'ポートフォリオ',
				'option_key' => self::OPTION_PAGE_PORTFOLIO,
			),
			array(
				'slug'       => 'dashboard',
				'title'      => 'ダッシュボード',
				'option_key' => self::OPTION_PAGE_DASHBOARD,
			),
			array(
				'slug'       => 'reviews',
				'title'      => '口コミ',
				'option_key' => self::OPTION_PAGE_REVIEWS,
			),
		);

		foreach ( $pages as $page_def ) {
			$page = get_page_by_path( $page_def['slug'], OBJECT, 'page' );
			if ( ! ( $page instanceof WP_Post ) ) {
				$page_id = wp_insert_post(
					array(
						'post_type'    => 'page',
						'post_status'  => 'publish',
						'post_title'   => $page_def['title'],
						'post_name'    => $page_def['slug'],
						'post_content' => self::SHORTCODE_CONTENT,
					),
					true
				);
				if ( is_wp_error( $page_id ) || $page_id <= 0 ) {
					continue;
				}
				update_option( $page_def['option_key'], (int) $page_id, false );
				continue;
			}

			if ( self::SHORTCODE_CONTENT !== trim( (string) $page->post_content ) ) {
				wp_update_post(
					array(
						'ID'           => (int) $page->ID,
						'post_content' => self::SHORTCODE_CONTENT,
					)
				);
			}
			update_option( $page_def['option_key'], (int) $page->ID, false );
		}
	}

	/**
	 * Ensure custom role/capabilities for portfolio operators.
	 *
	 * @return void
	 */
	private static function ensure_roles_and_caps() {
		$role = get_role( 'portfolio_editor' );
		if ( ! $role instanceof WP_Role ) {
			$role = add_role(
				'portfolio_editor',
				__( 'Portfolio Editor', 'mebuki-portfolio-manager' ),
				array(
					'read'                   => true,
					'upload_files'           => true,
					'mebuki_manage_portfolio' => true,
				)
			);
		}

		if ( $role instanceof WP_Role ) {
			$role->add_cap( 'read' );
			$role->add_cap( 'upload_files' );
			$role->add_cap( 'mebuki_manage_portfolio' );
		}
	}

	/**
	 * Load class files.
	 *
	 * @return void
	 */
	private static function load_dependencies() {
		$autoload = MEBUKI_PM_PATH . 'vendor/autoload.php';
		if ( is_readable( $autoload ) ) {
			require_once $autoload;
		}
		require_once MEBUKI_PM_PATH . 'includes/class-db.php';
		require_once MEBUKI_PM_PATH . 'includes/class-api.php';
		require_once MEBUKI_PM_PATH . 'includes/class-admin.php';
		require_once MEBUKI_PM_PATH . 'includes/class-frontend.php';
	}
}

register_activation_hook( MEBUKI_PM_FILE, array( 'Mebuki_Portfolio_Manager', 'activate' ) );
Mebuki_Portfolio_Manager::init();


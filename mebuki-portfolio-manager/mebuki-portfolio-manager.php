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

	/**
	 * Boot plugin runtime.
	 *
	 * @return void
	 */
	public static function init() {
		self::load_dependencies();
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
		Mebuki_PM_DB::migrate();
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


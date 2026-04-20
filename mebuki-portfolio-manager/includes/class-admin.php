<?php

defined( 'ABSPATH' ) || exit;

/**
 * WordPress admin UI: menu, SPA mount container, asset enqueue, REST bootstrap data.
 */
class Mebuki_PM_Admin {

	public const MENU_SLUG = 'mebuki-pm';

	public const SCRIPT_HANDLE = 'mebuki-pm-admin';

	/** Shared React/runtime chunk (Vite manualChunks); loaded before admin.js (ESM). */
	public const VENDOR_HANDLE = 'mebuki-pm-vendor';

	/** Shared settings parser chunk (`mergeSettings`); loaded after vendor, before entry. */
	public const SETTINGS_CHUNK_HANDLE = 'mebuki-pm-settings-chunk';

	public const STYLE_HANDLE = 'mebuki-pm-admin-style';

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	/**
	 * Add top-level admin menu (capability-gated by WordPress).
	 *
	 * @return void
	 */
	public static function register_menu() {
		add_menu_page(
			__( 'Mebuki Portfolio Manager', 'mebuki-portfolio-manager' ),
			__( 'Mebuki PM', 'mebuki-portfolio-manager' ),
			'manage_options',
			self::MENU_SLUG,
			array( __CLASS__, 'render_app' ),
			'dashicons-portfolio',
			59
		);
	}

	/**
	 * Render React mount point (only when user may access this screen).
	 *
	 * @return void
	 */
	public static function render_app() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die(
				esc_html__( 'Sorry, you are not allowed to access this page.', 'mebuki-portfolio-manager' ),
				esc_html__( 'Forbidden', 'mebuki-portfolio-manager' ),
				array( 'response' => 403 )
			);
		}

		echo '<div class="wrap">';
		echo '<div id="mebuki-admin-root"></div>';
		echo '</div>';
	}

	/**
	 * Enqueue built admin bundle only on our plugin screen and for permitted users.
	 *
	 * @param string $hook_suffix Current admin screen hook.
	 * @return void
	 */
	public static function enqueue_assets( $hook_suffix ) {
		$expected = 'toplevel_page_' . self::MENU_SLUG;
		if ( $hook_suffix !== $expected ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$script_rel = 'assets/admin.js';
		$style_rel  = 'assets/admin.css';
		$script_fs  = MEBUKI_PM_PATH . $script_rel;
		$style_fs   = MEBUKI_PM_PATH . $style_rel;

		if ( ! is_readable( $script_fs ) ) {
			return;
		}

		wp_enqueue_media();

		$base_url = plugin_dir_url( MEBUKI_PM_FILE );
		$ver_js   = is_readable( $script_fs ) ? (string) filemtime( $script_fs ) : '0.1.0';
		$ver_css  = is_readable( $style_fs ) ? (string) filemtime( $style_fs ) : $ver_js;

		$vendor_rel = 'assets/chunks/mebuki-vendor.js';
		$vendor_fs  = MEBUKI_PM_PATH . $vendor_rel;
		$deps       = array( 'jquery', 'media-editor' );
		if ( is_readable( $vendor_fs ) ) {
			wp_enqueue_script(
				self::VENDOR_HANDLE,
				$base_url . $vendor_rel,
				array(),
				(string) filemtime( $vendor_fs ),
				true
			);
			$deps[] = self::VENDOR_HANDLE;
		}

		$settings_rel = 'assets/chunks/mebuki-settings.js';
		$settings_fs  = MEBUKI_PM_PATH . $settings_rel;
		if ( is_readable( $settings_fs ) ) {
			wp_enqueue_script(
				self::SETTINGS_CHUNK_HANDLE,
				$base_url . $settings_rel,
				is_readable( $vendor_fs ) ? array( self::VENDOR_HANDLE ) : array(),
				(string) filemtime( $settings_fs ),
				true
			);
			$deps[] = self::SETTINGS_CHUNK_HANDLE;
		}

		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			$base_url . $script_rel,
			$deps,
			$ver_js,
			true
		);

		wp_localize_script(
			self::SCRIPT_HANDLE,
			'mebukiPmRest',
			array(
				'root'          => esc_url_raw( rest_url() ),
				'nonce'         => wp_create_nonce( 'wp_rest' ),
				'siteUrl'       => esc_url_raw( home_url( '/' ) ),
				'portfolioPath' => esc_url_raw(
					home_url(
						'/' . Mebuki_PM_Frontend::BASE_PATH . '/' . sanitize_title( (string) wp_get_current_user()->user_nicename ) . '/'
					)
				),
			)
		);

		if ( is_readable( $style_fs ) ) {
			wp_enqueue_style(
				self::STYLE_HANDLE,
				$base_url . $style_rel,
				array(),
				$ver_css
			);
		}
	}
}

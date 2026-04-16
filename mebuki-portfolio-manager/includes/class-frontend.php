<?php

defined( 'ABSPATH' ) || exit;

/**
 * Public portfolio shortcode, frontend bundle enqueue, and bootstrap data.
 */
class Mebuki_PM_Frontend {

	public const SHORTCODE = 'mebuki_portfolio';

	public const SCRIPT_HANDLE = 'mebuki-pm-frontend';

	public const STYLE_HANDLE = 'mebuki-pm-frontend-style';

	/** Option name: valid administrator user ID whose settings power the public portfolio (optional). */
	private const PORTFOLIO_OWNER_USER_OPTION = 'mebuki_pm_portfolio_owner_user_id';

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_shortcode( self::SHORTCODE, array( __CLASS__, 'render_shortcode' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_assets' ) );
	}

	/**
	 * Resolve the WordPress user ID whose saved settings power the public portfolio.
	 *
	 * @return int
	 */
	private static function get_portfolio_owner_user_id() {
		$explicit = (int) get_option( self::PORTFOLIO_OWNER_USER_OPTION, 0 );
		if ( $explicit > 0 ) {
			$user = get_user_by( 'id', $explicit );
			if ( $user instanceof WP_User && user_can( $user, 'manage_options' ) ) {
				return (int) $user->ID;
			}
		}

		$admins = get_users(
			array(
				'role'   => 'administrator',
				'number' => 1,
				'fields' => array( 'ID' ),
			)
		);
		if ( ! empty( $admins ) && isset( $admins[0]->ID ) ) {
			return (int) $admins[0]->ID;
		}
		return 1;
	}

	/**
	 * Load settings array from the option mirror (same shape as admin REST payload).
	 *
	 * @return array<string, mixed>
	 */
	private static function get_settings_for_localize() {
		$user_id  = self::get_portfolio_owner_user_id();
		$option   = get_option( 'mebuki_pm_settings_' . $user_id, array() );
		if ( ! is_array( $option ) ) {
			return array();
		}
		return $option;
	}

	/**
	 * Enqueue frontend assets only on singular content that includes the shortcode.
	 *
	 * @return void
	 */
	public static function maybe_enqueue_assets() {
		if ( ! is_singular() ) {
			return;
		}

		global $post;
		if ( ! $post instanceof WP_Post ) {
			return;
		}

		if ( ! has_shortcode( $post->post_content, self::SHORTCODE ) ) {
			return;
		}

		$script_rel = 'assets/frontend.js';
		$style_rel  = 'assets/frontend.css';
		$script_fs  = MEBUKI_PM_PATH . $script_rel;
		$style_fs   = MEBUKI_PM_PATH . $style_rel;

		if ( ! is_readable( $script_fs ) ) {
			return;
		}

		$base_url = plugin_dir_url( MEBUKI_PM_FILE );
		$ver_js   = (string) filemtime( $script_fs );
		$ver_css  = is_readable( $style_fs ) ? (string) filemtime( $style_fs ) : $ver_js;

		$vendor_rel = 'assets/chunks/mebuki-vendor.js';
		$vendor_fs  = MEBUKI_PM_PATH . $vendor_rel;
		$deps       = array();
		if ( is_readable( $vendor_fs ) ) {
			wp_enqueue_script(
				Mebuki_PM_Admin::VENDOR_HANDLE,
				$base_url . $vendor_rel,
				array(),
				(string) filemtime( $vendor_fs ),
				true
			);
			$deps[] = Mebuki_PM_Admin::VENDOR_HANDLE;
		}

		$settings_rel = 'assets/chunks/mebuki-settings.js';
		$settings_fs  = MEBUKI_PM_PATH . $settings_rel;
		if ( is_readable( $settings_fs ) ) {
			$settings_deps = array();
			if ( is_readable( $vendor_fs ) ) {
				$settings_deps[] = Mebuki_PM_Admin::VENDOR_HANDLE;
			}
			wp_enqueue_script(
				Mebuki_PM_Admin::SETTINGS_CHUNK_HANDLE,
				$base_url . $settings_rel,
				$settings_deps,
				(string) filemtime( $settings_fs ),
				true
			);
			$deps[] = Mebuki_PM_Admin::SETTINGS_CHUNK_HANDLE;
		}

		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			$base_url . $script_rel,
			$deps,
			$ver_js,
			true
		);

		$owner_id = self::get_portfolio_owner_user_id();

		wp_localize_script(
			self::SCRIPT_HANDLE,
			'mebukiPmSettings',
			array(
				'root'              => esc_url_raw( rest_url() ),
				'nonce'             => wp_create_nonce( 'wp_rest' ),
				'settings'          => self::get_settings_for_localize(),
				'portfolioUserId'   => $owner_id,
				'siteName'          => wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
				'siteUrl'           => esc_url_raw( home_url( '/' ) ),
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

	/**
	 * Shortcode output: React mount container only (scripts/styles enqueued separately).
	 *
	 * @param array<string, string> $atts Shortcode attributes (unused).
	 * @return string
	 */
	public static function render_shortcode( $atts ) {
		unset( $atts );
		return '<div id="mebuki-frontend-root"></div>';
	}
}

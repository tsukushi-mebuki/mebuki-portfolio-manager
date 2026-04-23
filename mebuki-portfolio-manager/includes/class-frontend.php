<?php

defined( 'ABSPATH' ) || exit;

/**
 * Public portfolio shortcode, frontend bundle enqueue, and bootstrap data.
 */
class Mebuki_PM_Frontend {

	public const SHORTCODE = 'mebuki_portfolio';
	public const QUERY_VAR_USER = 'mebuki_portfolio_user';
	public const QUERY_VAR_MODE = 'mebuki_portfolio_mode';
	public const BASE_PATH = 'portfolio';
	public const PAGE_SLUG_DASHBOARD = 'dashboard';
	public const MODE_REVIEWS = 'reviews';
	public const MODE_DASHBOARD = 'admin_dashboard';

	public const SCRIPT_HANDLE = 'mebuki-pm-frontend';

	public const STYLE_HANDLE = 'mebuki-pm-frontend-style';

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_shortcode( self::SHORTCODE, array( __CLASS__, 'render_shortcode' ) );
		add_action( 'init', array( __CLASS__, 'register_rewrite_rules' ) );
		add_filter( 'query_vars', array( __CLASS__, 'register_query_vars' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_assets' ) );
		add_action( 'wp_head', array( __CLASS__, 'print_shortcode_page_styles' ) );
		add_filter( 'body_class', array( __CLASS__, 'filter_body_class' ) );
	}

	/**
	 * Hide theme page titles on shortcode pages and start rendering from shortcode output.
	 *
	 * @return void
	 */
	public static function print_shortcode_page_styles() {
		if ( ! self::is_portfolio_shortcode_request() ) {
			return;
		}
		echo '<style id="mebuki-pm-shortcode-page-style">.mebuki-portfolio-page .entry-title,.mebuki-portfolio-page .page-title,.mebuki-portfolio-page .wp-block-post-title{display:none!important;}</style>';
	}

	/**
	 * Add a dedicated body class on pages where this plugin renders frontend/admin UI.
	 *
	 * @param array<int, string> $classes Existing body classes.
	 * @return array<int, string>
	 */
	public static function filter_body_class( $classes ) {
		if ( self::is_portfolio_shortcode_request() ) {
			$classes[] = 'mebuki-portfolio-page';
		}
		return $classes;
	}

	/**
	 * Whether current request renders the portfolio shortcode page.
	 *
	 * @return bool
	 */
	private static function is_portfolio_shortcode_request() {
		if ( ! is_singular() ) {
			return false;
		}

		global $post;
		if ( ! $post instanceof WP_Post ) {
			return false;
		}

		return has_shortcode( $post->post_content, self::SHORTCODE );
	}

	/**
	 * Register frontend rewrite rules.
	 *
	 * @return void
	 */
	public static function register_rewrite_rules() {
		add_rewrite_rule(
			'^' . self::PAGE_SLUG_DASHBOARD . '/?$',
			'index.php?pagename=' . self::PAGE_SLUG_DASHBOARD . '&' . self::QUERY_VAR_MODE . '=' . self::MODE_DASHBOARD,
			'top'
		);
		add_rewrite_rule(
			'^' . self::BASE_PATH . '/admin/dashboard/?$',
			'index.php?pagename=' . self::BASE_PATH . '&' . self::QUERY_VAR_MODE . '=' . self::MODE_DASHBOARD,
			'top'
		);
		add_rewrite_rule(
			'^' . self::BASE_PATH . '/([^/]+)/reviews/?$',
			'index.php?pagename=' . self::BASE_PATH . '&' . self::QUERY_VAR_USER . '=$matches[1]&' . self::QUERY_VAR_MODE . '=' . self::MODE_REVIEWS,
			'top'
		);
		add_rewrite_rule(
			'^' . self::BASE_PATH . '/([^/]+)/?$',
			'index.php?pagename=' . self::BASE_PATH . '&' . self::QUERY_VAR_USER . '=$matches[1]',
			'top'
		);
	}

	/**
	 * Register custom query vars.
	 *
	 * @param array $vars Query vars.
	 * @return array
	 */
	public static function register_query_vars( $vars ) {
		$vars[] = self::QUERY_VAR_USER;
		$vars[] = self::QUERY_VAR_MODE;
		return $vars;
	}

	/**
	 * Resolve owner context from query var.
	 *
	 * @return array{user_id:int,user_slug:string}|null
	 */
	private static function resolve_owner_context() {
		$raw_slug = get_query_var( self::QUERY_VAR_USER );
		$slug = sanitize_title( is_string( $raw_slug ) ? $raw_slug : '' );
		if ( '' === $slug ) {
			return null;
		}
		$user = get_user_by( 'slug', $slug );
		if ( ! $user instanceof WP_User ) {
			return null;
		}
		return array(
			'user_id'   => (int) $user->ID,
			'user_slug' => (string) $user->user_nicename,
		);
	}

	/**
	 * Legacy fallback owner (single-portfolio sites).
	 *
	 * @return array{user_id:int,user_slug:string}
	 */
	private static function resolve_legacy_owner_context() {
		$admins = get_users(
			array(
				'role'   => 'administrator',
				'number' => 1,
				'fields' => array( 'ID', 'user_nicename' ),
			)
		);
		if ( ! empty( $admins ) && isset( $admins[0]->ID ) ) {
			return array(
				'user_id'   => (int) $admins[0]->ID,
				'user_slug' => isset( $admins[0]->user_nicename ) ? sanitize_title( (string) $admins[0]->user_nicename ) : '',
			);
		}
		return array(
			'user_id'   => 1,
			'user_slug' => '',
		);
	}

	/**
	 * Resolve owner for public rendering.
	 *
	 * @return array{user_id:int,user_slug:string}
	 */
	private static function get_portfolio_owner_context() {
		$from_query = self::resolve_owner_context();
		if ( null !== $from_query ) {
			return $from_query;
		}
		return self::resolve_legacy_owner_context();
	}

	/**
	 * Load settings array from the option mirror (same shape as admin REST payload).
	 *
	 * @return array<string, mixed>
	 */
	private static function get_settings_for_localize( $user_id ) {
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

		$mode = sanitize_key( (string) get_query_var( self::QUERY_VAR_MODE ) );
		if ( self::MODE_DASHBOARD === $mode ) {
			self::maybe_enqueue_dashboard_assets();
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

		$owner_ctx = self::get_portfolio_owner_context();
		$owner_id  = $owner_ctx['user_id'];
		$owner_slug = $owner_ctx['user_slug'];
		$portfolio_path = '' !== $owner_slug
			? home_url( '/' . self::BASE_PATH . '/' . $owner_slug . '/' )
			: home_url( '/' );

		wp_localize_script(
			self::SCRIPT_HANDLE,
			'mebukiPmSettings',
			array(
				'root'              => esc_url_raw( rest_url() ),
				'nonce'             => wp_create_nonce( 'wp_rest' ),
				'settings'          => self::get_settings_for_localize( $owner_id ),
				'portfolioUserId'   => $owner_id,
				'portfolioUserSlug' => $owner_slug,
				'portfolioPath'     => esc_url_raw( $portfolio_path ),
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
	 * Whether current user can access frontend dashboard.
	 *
	 * @return bool
	 */
	private static function can_access_frontend_dashboard() {
		return is_user_logged_in() && ( current_user_can( 'manage_options' ) || current_user_can( 'mebuki_manage_portfolio' ) );
	}

	/**
	 * Build bootstrap payload used by the admin React app.
	 *
	 * @return array<string, string>
	 */
	private static function get_dashboard_rest_bootstrap() {
		$user = wp_get_current_user();
		$slug = sanitize_title( (string) $user->user_nicename );
		$portfolio_path = '' !== $slug
			? home_url( '/' . self::BASE_PATH . '/' . $slug . '/' )
			: esc_url_raw( home_url( '/' ) );

		return array(
			'root'          => esc_url_raw( rest_url() ),
			'nonce'         => wp_create_nonce( 'wp_rest' ),
			'siteUrl'       => esc_url_raw( home_url( '/' ) ),
			'portfolioPath' => esc_url_raw( $portfolio_path ),
		);
	}

	/**
	 * Enqueue admin dashboard bundles on frontend dashboard route.
	 *
	 * @return void
	 */
	private static function maybe_enqueue_dashboard_assets() {
		if ( ! self::can_access_frontend_dashboard() ) {
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
		$ver_js   = (string) filemtime( $script_fs );
		$ver_css  = is_readable( $style_fs ) ? (string) filemtime( $style_fs ) : $ver_js;

		$vendor_rel = 'assets/chunks/mebuki-vendor.js';
		$vendor_fs  = MEBUKI_PM_PATH . $vendor_rel;
		$deps       = array( 'jquery', 'media-editor' );
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
			$settings_deps = is_readable( $vendor_fs ) ? array( Mebuki_PM_Admin::VENDOR_HANDLE ) : array();
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
			Mebuki_PM_Admin::SCRIPT_HANDLE,
			$base_url . $script_rel,
			$deps,
			$ver_js,
			true
		);

		wp_localize_script(
			Mebuki_PM_Admin::SCRIPT_HANDLE,
			'mebukiPmRest',
			self::get_dashboard_rest_bootstrap()
		);

		if ( is_readable( $style_fs ) ) {
			wp_enqueue_style(
				Mebuki_PM_Admin::STYLE_HANDLE,
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
		$mode = sanitize_key( (string) get_query_var( self::QUERY_VAR_MODE ) );
		if ( self::MODE_DASHBOARD === $mode ) {
			if ( ! self::can_access_frontend_dashboard() ) {
				$login_url = wp_login_url( home_url( '/' . self::PAGE_SLUG_DASHBOARD . '/' ) );
				return sprintf(
					'<div class="mebuki-dashboard-auth-required"><p>%s</p><p><a href="%s">%s</a></p></div>',
					esc_html__( 'このダッシュボードを表示する権限がありません。', 'mebuki-portfolio-manager' ),
					esc_url( $login_url ),
					esc_html__( 'ログインしてアクセス', 'mebuki-portfolio-manager' )
				);
			}
			return '<div id="mebuki-admin-root"></div>';
		}
		return '<div id="mebuki-frontend-root"></div>';
	}
}

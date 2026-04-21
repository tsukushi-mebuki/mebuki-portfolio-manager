<?php

defined( 'ABSPATH' ) || exit;

/**
 * Portfolio editor media: WebP on upload, own-attachments-only in library/REST.
 */
class Mebuki_PM_Media {

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'wp_handle_upload', array( __CLASS__, 'maybe_convert_upload_to_webp' ), 99, 2 );
		add_filter( 'ajax_query_attachments_args', array( __CLASS__, 'filter_ajax_attachment_query' ) );
		add_filter( 'rest_attachment_query', array( __CLASS__, 'filter_rest_attachment_query' ), 10, 2 );
		add_filter( 'rest_pre_dispatch', array( __CLASS__, 'restrict_rest_single_attachment' ), 10, 3 );
	}

	/**
	 * Non-admin portfolio editors only see their own attachments in the media modal and REST list.
	 *
	 * @return bool
	 */
	private static function should_scope_attachments_to_current_user() {
		if ( ! is_user_logged_in() ) {
			return false;
		}
		if ( current_user_can( 'manage_options' ) ) {
			return false;
		}
		return current_user_can( 'mebuki_manage_portfolio' );
	}

	/**
	 * Portfolio editors (non-admin): convert raster uploads to WebP after upload.
	 *
	 * @return bool
	 */
	private static function should_convert_upload_to_webp() {
		if ( ! is_user_logged_in() ) {
			return false;
		}
		if ( current_user_can( 'manage_options' ) ) {
			return false;
		}
		return current_user_can( 'mebuki_manage_portfolio' );
	}

	/**
	 * Media modal (wp.media) uses admin-ajax attachment query.
	 *
	 * @param array<string, mixed> $args Query args.
	 * @return array<string, mixed>
	 */
	public static function filter_ajax_attachment_query( $args ) {
		if ( ! self::should_scope_attachments_to_current_user() ) {
			return $args;
		}
		$args['author'] = get_current_user_id();
		return $args;
	}

	/**
	 * REST GET /wp/v2/media collection.
	 *
	 * @param array<string, mixed> $args    Query args.
	 * @param WP_REST_Request      $request Request (unused; signature required).
	 * @return array<string, mixed>
	 */
	public static function filter_rest_attachment_query( $args, $request ) {
		unset( $request );
		if ( ! self::should_scope_attachments_to_current_user() ) {
			return $args;
		}
		$args['author'] = get_current_user_id();
		return $args;
	}

	/**
	 * Block access to another user's attachment via REST (single resource).
	 *
	 * @param mixed            $result  Response or null.
	 * @param WP_REST_Server   $server  Server.
	 * @param WP_REST_Request  $request Request.
	 * @return mixed|WP_Error
	 */
	public static function restrict_rest_single_attachment( $result, $server, $request ) {
		unset( $server );
		if ( 'OPTIONS' === $request->get_method() ) {
			return $result;
		}
		if ( ! self::should_scope_attachments_to_current_user() ) {
			return $result;
		}
		$route = $request->get_route();
		if ( ! preg_match( '#^/wp/v2/media/(\\d+)#', $route, $m ) ) {
			return $result;
		}
		$id = (int) $m[1];
		if ( $id <= 0 ) {
			return $result;
		}
		$post = get_post( $id );
		if ( ! $post instanceof WP_Post || 'attachment' !== $post->post_type ) {
			return $result;
		}
		if ( (int) $post->post_author === get_current_user_id() ) {
			return $result;
		}
		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to access this attachment.', 'mebuki-portfolio-manager' ),
			array( 'status' => 403 )
		);
	}

	/**
	 * Replace JPEG/PNG/GIF file with WebP (same basename) for portfolio editors.
	 *
	 * @param array<string, string|bool> $upload  Upload data from wp_handle_upload.
	 * @param string                     $context 'upload' or 'sideload'.
	 * @return array<string, string|bool>
	 */
	public static function maybe_convert_upload_to_webp( $upload, $context ) {
		unset( $context );
		if ( isset( $upload['error'] ) && false !== $upload['error'] ) {
			return $upload;
		}
		if ( ! self::should_convert_upload_to_webp() ) {
			return $upload;
		}
		$type = isset( $upload['type'] ) ? (string) $upload['type'] : '';
		if ( ! in_array(
			$type,
			array( 'image/jpeg', 'image/pjpeg', 'image/png', 'image/gif' ),
			true
		) ) {
			return $upload;
		}
		if ( ! function_exists( 'wp_image_editor_supports' ) || ! wp_image_editor_supports( array( 'mime_type' => 'image/webp' ) ) ) {
			return $upload;
		}
		$file = isset( $upload['file'] ) ? (string) $upload['file'] : '';
		if ( '' === $file || ! is_readable( $file ) ) {
			return $upload;
		}
		$editor = wp_get_image_editor( $file );
		if ( is_wp_error( $editor ) ) {
			return $upload;
		}
		$quality = (int) apply_filters( 'mebuki_pm_webp_quality', 82 );
		if ( $quality < 1 ) {
			$quality = 82;
		}
		if ( $quality > 100 ) {
			$quality = 100;
		}
		$editor->set_quality( $quality );
		$info = pathinfo( $file );
		$webp_file = $info['dirname'] . '/' . $info['filename'] . '.webp';
		$saved       = $editor->save( $webp_file, 'image/webp' );
		if ( is_wp_error( $saved ) || empty( $saved['path'] ) ) {
			return $upload;
		}
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@unlink( $file );
		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			return $upload;
		}
		$path_norm = wp_normalize_path( $saved['path'] );
		$base_norm = wp_normalize_path( $upload_dir['basedir'] );
		$new_url   = $upload_dir['baseurl'] . str_replace( $base_norm, '', $path_norm );
		$new_url   = str_replace( '\\', '/', $new_url );
		return array(
			'file' => $saved['path'],
			'url'  => $new_url,
			'type' => 'image/webp',
		);
	}
}

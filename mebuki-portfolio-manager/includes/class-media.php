<?php

defined( 'ABSPATH' ) || exit;

/**
 * Media visibility controls for portfolio editors.
 */
class Mebuki_PM_Media {

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'ajax_query_attachments_args', array( __CLASS__, 'filter_ajax_query_attachments_args' ) );
		add_filter( 'rest_attachment_query', array( __CLASS__, 'filter_rest_attachment_query' ), 10, 2 );
		add_action( 'pre_get_posts', array( __CLASS__, 'filter_media_library_list_query' ) );
	}

	/**
	 * Whether current user should be restricted to own media only.
	 *
	 * @return bool
	 */
	private static function should_limit_to_own_media() {
		if ( ! is_user_logged_in() ) {
			return false;
		}
		if ( current_user_can( 'manage_options' ) ) {
			return false;
		}
		return current_user_can( 'mebuki_manage_portfolio' );
	}

	/**
	 * Restrict media modal AJAX query for portfolio editors.
	 *
	 * @param array<string, mixed> $query Attachment query args.
	 * @return array<string, mixed>
	 */
	public static function filter_ajax_query_attachments_args( $query ) {
		if ( self::should_limit_to_own_media() ) {
			$query['author'] = get_current_user_id();
		}
		return $query;
	}

	/**
	 * Restrict REST attachment query (block editor / REST consumers).
	 *
	 * @param array<string, mixed> $args    Query args.
	 * @param WP_REST_Request      $request Request object.
	 * @return array<string, mixed>
	 */
	public static function filter_rest_attachment_query( $args, $request ) {
		unset( $request );
		if ( self::should_limit_to_own_media() ) {
			$args['author'] = get_current_user_id();
		}
		return $args;
	}

	/**
	 * Restrict Media Library list table query in wp-admin/upload.php.
	 *
	 * @param WP_Query $query Query object.
	 * @return void
	 */
	public static function filter_media_library_list_query( $query ) {
		if ( ! $query instanceof WP_Query ) {
			return;
		}
		if ( ! is_admin() || ! $query->is_main_query() ) {
			return;
		}
		if ( 'attachment' !== (string) $query->get( 'post_type' ) ) {
			return;
		}
		if ( self::should_limit_to_own_media() ) {
			$query->set( 'author', get_current_user_id() );
		}
	}
}

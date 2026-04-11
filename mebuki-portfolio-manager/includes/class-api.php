<?php

defined( 'ABSPATH' ) || exit;

/**
 * Settings REST API controller.
 */
class Mebuki_PM_API {

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'mebuki-pm/v1',
			'/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_settings' ),
					'permission_callback' => array( __CLASS__, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'save_settings' ),
					'permission_callback' => array( __CLASS__, 'check_permission' ),
				),
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/settings/me',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_settings' ),
					'permission_callback' => array( __CLASS__, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'save_settings' ),
					'permission_callback' => array( __CLASS__, 'check_permission' ),
				),
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/orders',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'create_order' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/orders/checkout',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'create_order_checkout' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/orders/me',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'list_orders_for_owner' ),
				'permission_callback' => array( __CLASS__, 'check_permission' ),
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/orders/(?P<id>[\d]+)',
			array(
				'methods'             => 'PATCH',
				'callback'            => array( __CLASS__, 'patch_order_status' ),
				'permission_callback' => array( __CLASS__, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'required'          => true,
						'validate_callback' => static function ( $v ) {
							return is_numeric( $v ) && (int) $v > 0;
						},
					),
				),
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/reviews',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'create_review' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/reviews/me',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'list_reviews_for_owner' ),
				'permission_callback' => array( __CLASS__, 'check_permission' ),
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/reviews/published',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'list_published_reviews_for_user' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'user_id' => array(
						'required'          => true,
						'validate_callback' => static function ( $v ) {
							return is_numeric( $v ) && (int) $v > 0;
						},
					),
				),
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/reviews/(?P<id>[\d]+)',
			array(
				'methods'             => 'PATCH',
				'callback'            => array( __CLASS__, 'patch_review_visibility' ),
				'permission_callback' => array( __CLASS__, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'required'          => true,
						'validate_callback' => static function ( $v ) {
							return is_numeric( $v ) && (int) $v > 0;
						},
					),
				),
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/webhooks/stripe',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_stripe_webhook' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Common permission callback.
	 *
	 * - Requires administrator capability.
	 * - Validates X-WP-Nonce when provided (cookie-based auth best practice).
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return true|WP_Error
	 */
	public static function check_permission( WP_REST_Request $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'mebuki_pm_forbidden',
				__( 'You do not have permission to access this endpoint.', 'mebuki-portfolio-manager' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$nonce = $request->get_header( 'X-WP-Nonce' );
		if ( ! empty( $nonce ) && ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new WP_Error(
				'mebuki_pm_invalid_nonce',
				__( 'Invalid REST nonce.', 'mebuki-portfolio-manager' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * GET /settings
	 *
	 * @return WP_REST_Response
	 */
	public static function get_settings() {
		global $wpdb;

		$table_name = $wpdb->prefix . 'mebuki_pm_settings';
		$user_id    = get_current_user_id();

		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT setting_json, updated_at FROM {$table_name} WHERE user_id = %d ORDER BY id DESC LIMIT 1",
				$user_id
			),
			ARRAY_A
		);

		if ( empty( $row ) ) {
			return rest_ensure_response(
				array(
					'settings'   => (object) array(),
					'updated_at' => null,
				)
			);
		}

		$decoded_settings = json_decode( $row['setting_json'] );
		if ( null === $decoded_settings && 'null' !== strtolower( trim( $row['setting_json'] ) ) ) {
			$decoded_settings = (object) array();
		}

		return rest_ensure_response(
			array(
				'settings'   => $decoded_settings,
				'updated_at' => $row['updated_at'],
			)
		);
	}

	/**
	 * POST /settings
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function save_settings( WP_REST_Request $request ) {
		global $wpdb;

		$table_name = $wpdb->prefix . 'mebuki_pm_settings';
		$user_id    = get_current_user_id();
		$params     = $request->get_json_params();

		if ( null === $params ) {
			$params = $request->get_params();
		}

		if ( isset( $params['endpoint'] ) && '' !== (string) $params['endpoint'] ) {
			$endpoint = esc_url_raw( wp_unslash( (string) $params['endpoint'] ) );
			$parsed_endpoint = wp_parse_url( $endpoint );
			$valid_scheme    = isset( $parsed_endpoint['scheme'] ) && in_array( strtolower( $parsed_endpoint['scheme'] ), array( 'http', 'https' ), true );
			$valid_host      = isset( $parsed_endpoint['host'] ) && false !== strpos( $parsed_endpoint['host'], '.' );
			if ( '' === $endpoint || false === filter_var( $endpoint, FILTER_VALIDATE_URL ) || ! $valid_scheme || ! $valid_host ) {
				return new WP_Error(
					'mebuki_pm_invalid_endpoint',
					__( 'endpoint must be a valid URL.', 'mebuki-portfolio-manager' ),
					array( 'status' => 400 )
				);
			}
			$params['endpoint'] = $endpoint;
		}

		$encoded_settings = wp_json_encode( $params );
		if ( false === $encoded_settings ) {
			return new WP_Error(
				'mebuki_pm_json_encode_failed',
				__( 'Failed to encode settings payload.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$existing_id = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT id FROM {$table_name} WHERE user_id = %d ORDER BY id DESC LIMIT 1",
				$user_id
			)
		);

		if ( $existing_id ) {
			$result = $wpdb->update(
				$table_name,
				array(
					'setting_json' => $encoded_settings,
				),
				array(
					'id' => (int) $existing_id,
				),
				array( '%s' ),
				array( '%d' )
			);
		} else {
			$result = $wpdb->insert(
				$table_name,
				array(
					'user_id'      => $user_id,
					'setting_json' => $encoded_settings,
				),
				array( '%d', '%s' )
			);
		}

		if ( false === $result ) {
			return new WP_Error(
				'mebuki_pm_db_write_failed',
				__( 'Failed to save settings.', 'mebuki-portfolio-manager' ),
				array( 'status' => 500 )
			);
		}

		update_option( 'mebuki_pm_settings_' . $user_id, $params, false );

		return rest_ensure_response(
			array(
				'success'  => true,
				'user_id'  => $user_id,
				'settings' => json_decode( $encoded_settings ),
			)
		);
	}

	/**
	 * POST /orders
	 *
	 * Public endpoint for end-user inquiries/orders.
	 * Future hardening: nonce/captcha/honeypot/rate-limit.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function create_order( WP_REST_Request $request ) {
		global $wpdb;

		$table_name = $wpdb->prefix . 'mebuki_pm_orders';
		$params     = $request->get_json_params();
		if ( null === $params ) {
			$params = $request->get_params();
		}

		$user_id = isset( $params['user_id'] ) ? absint( $params['user_id'] ) : 0;
		$uuid    = isset( $params['uuid'] ) ? sanitize_text_field( wp_unslash( (string) $params['uuid'] ) ) : '';

		if ( 0 === $user_id ) {
			return new WP_Error(
				'mebuki_pm_user_id_required',
				__( 'user_id is required.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		if ( ! preg_match( '/^[a-f0-9-]{36}$/i', $uuid ) ) {
			return new WP_Error(
				'mebuki_pm_invalid_uuid',
				__( 'uuid must be a valid 36-char UUID string.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$existing = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE uuid = %s LIMIT 1",
				$uuid
			),
			ARRAY_A
		);

		if ( ! empty( $existing ) ) {
			return rest_ensure_response(
				array(
					'success'    => true,
					'idempotent' => true,
					'order'      => self::normalize_order_row( $existing ),
				)
			);
		}

		$order_details = array();
		if ( isset( $params['order_details'] ) && is_array( $params['order_details'] ) ) {
			$order_details = $params['order_details'];
		} elseif ( isset( $params['order_details_json'] ) && is_array( $params['order_details_json'] ) ) {
			$order_details = $params['order_details_json'];
		}

		$message = isset( $params['message'] ) ? sanitize_textarea_field( wp_unslash( (string) $params['message'] ) ) : '';
		if ( '' !== $message ) {
			$order_details['message'] = $message;
		}

		$encoded_details = wp_json_encode( $order_details );
		$client_name        = isset( $params['client_name'] ) ? sanitize_text_field( wp_unslash( (string) $params['client_name'] ) ) : '';
		$client_email       = isset( $params['client_email'] ) ? sanitize_email( wp_unslash( (string) $params['client_email'] ) ) : '';
		$status             = isset( $params['status'] ) ? sanitize_key( wp_unslash( (string) $params['status'] ) ) : 'new';
		$total_amount       = isset( $params['total_amount'] ) ? absint( $params['total_amount'] ) : 0;

		if ( false === $encoded_details ) {
			return new WP_Error(
				'mebuki_pm_order_json_encode_failed',
				__( 'Failed to encode order_details.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		if ( '' === $client_name || '' === $client_email || ! is_email( $client_email ) ) {
			return new WP_Error(
				'mebuki_pm_invalid_order_input',
				__( 'client_name and valid client_email are required.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$inserted = $wpdb->insert(
			$table_name,
			array(
				'user_id'            => $user_id,
				'uuid'               => $uuid,
				'client_name'        => $client_name,
				'client_email'       => $client_email,
				'status'             => $status,
				'total_amount'       => $total_amount,
				'order_details_json' => $encoded_details,
			),
			array( '%d', '%s', '%s', '%s', '%s', '%d', '%s' )
		);

		if ( false === $inserted ) {
			// Handles race conditions on UNIQUE(uuid) by returning the existing row.
			$existing_after_error = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT * FROM {$table_name} WHERE uuid = %s LIMIT 1",
					$uuid
				),
				ARRAY_A
			);

			if ( ! empty( $existing_after_error ) ) {
				return rest_ensure_response(
					array(
						'success'    => true,
						'idempotent' => true,
						'order'      => self::normalize_order_row( $existing_after_error ),
					)
				);
			}

			return new WP_Error(
				'mebuki_pm_order_insert_failed',
				__( 'Failed to create order.', 'mebuki-portfolio-manager' ),
				array( 'status' => 500 )
			);
		}

		$created = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE id = %d LIMIT 1",
				(int) $wpdb->insert_id
			),
			ARRAY_A
		);

		return rest_ensure_response(
			array(
				'success'    => true,
				'idempotent' => false,
				'order'      => self::normalize_order_row( $created ),
			)
		);
	}

	/**
	 * Resolve Stripe secret key from saved portfolio settings (option mirror).
	 *
	 * @param int $user_id Portfolio owner user id.
	 * @return string Empty if unset.
	 */
	private static function get_stripe_secret_key_for_user( $user_id ) {
		$option = get_option( 'mebuki_pm_settings_' . absint( $user_id ), array() );
		if ( is_array( $option ) && isset( $option['stripe_secret_key'] ) && is_string( $option['stripe_secret_key'] ) ) {
			$key = trim( $option['stripe_secret_key'] );
			if ( '' !== $key ) {
				return $key;
			}
		}
		return '';
	}

	/**
	 * Same resolution as frontend portfolio owner (first administrator).
	 *
	 * @return int
	 */
	private static function get_portfolio_owner_user_id() {
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
	 * Webhook signing secret (whsec_...) from saved settings option mirror.
	 *
	 * @param int $user_id Portfolio owner user id.
	 * @return string Empty if unset.
	 */
	private static function get_stripe_webhook_secret_for_user( $user_id ) {
		$option = get_option( 'mebuki_pm_settings_' . absint( $user_id ), array() );
		if ( is_array( $option ) && isset( $option['stripe_webhook_secret'] ) && is_string( $option['stripe_webhook_secret'] ) ) {
			$s = trim( $option['stripe_webhook_secret'] );
			if ( '' !== $s ) {
				return $s;
			}
		}
		return '';
	}

	/**
	 * POST /webhooks/stripe — verify signature and update order on checkout.session.completed.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response
	 */
	public static function handle_stripe_webhook( WP_REST_Request $request ) {
		global $wpdb;

		if ( ! class_exists( '\Stripe\Webhook' ) ) {
			return new WP_REST_Response(
				array( 'message' => 'Stripe SDK missing' ),
				500
			);
		}

		$payload = $request->get_body();
		if ( '' === $payload ) {
			return new WP_REST_Response(
				array( 'message' => 'Empty body' ),
				400
			);
		}

		$sig_header = $request->get_header( 'stripe_signature' );
		if ( empty( $sig_header ) ) {
			return new WP_REST_Response(
				array( 'message' => 'Missing Stripe-Signature header' ),
				400
			);
		}

		$webhook_secret = self::get_stripe_webhook_secret_for_user( self::get_portfolio_owner_user_id() );
		if ( '' === $webhook_secret ) {
			return new WP_REST_Response(
				array( 'message' => 'Webhook secret not configured' ),
				400
			);
		}

		try {
			$event = \Stripe\Webhook::constructEvent(
				$payload,
				$sig_header,
				$webhook_secret
			);
		} catch ( \UnexpectedValueException $e ) {
			return new WP_REST_Response(
				array( 'message' => 'Invalid payload' ),
				400
			);
		} catch ( \Stripe\Exception\SignatureVerificationException $e ) {
			return new WP_REST_Response(
				array( 'message' => 'Invalid signature' ),
				400
			);
		}

		if ( 'checkout.session.completed' !== $event->type ) {
			return new WP_REST_Response( array( 'received' => true ), 200 );
		}

		$session = $event->data->object;
		$meta    = isset( $session->metadata ) ? $session->metadata : null;
		$oid_raw = '';
		if ( is_object( $meta ) && isset( $meta->order_id ) ) {
			$oid_raw = (string) $meta->order_id;
		} elseif ( is_array( $meta ) && isset( $meta['order_id'] ) ) {
			$oid_raw = (string) $meta['order_id'];
		}

		$order_id = absint( $oid_raw );
		if ( $order_id <= 0 ) {
			return new WP_REST_Response( array( 'received' => true, 'skipped' => 'no_order_id' ), 200 );
		}

		$table_name = $wpdb->prefix . 'mebuki_pm_orders';
		$row        = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE id = %d LIMIT 1",
				$order_id
			),
			ARRAY_A
		);

		if ( empty( $row ) ) {
			return new WP_REST_Response( array( 'received' => true, 'skipped' => 'order_not_found' ), 200 );
		}

		$owner_id = self::get_portfolio_owner_user_id();
		if ( (int) $row['user_id'] !== $owner_id ) {
			return new WP_REST_Response( array( 'received' => true, 'skipped' => 'wrong_owner' ), 200 );
		}

		$details = json_decode( $row['order_details_json'], true );
		if ( ! is_array( $details ) ) {
			$details = array();
		}

		$pi = '';
		if ( isset( $session->payment_intent ) ) {
			$pi = is_string( $session->payment_intent )
				? $session->payment_intent
				: ( isset( $session->payment_intent->id ) ? (string) $session->payment_intent->id : '' );
		}

		$details['stripe_payment'] = array(
			'checkout_session_id' => isset( $session->id ) ? (string) $session->id : '',
			'payment_intent'      => $pi,
			'amount_total'        => isset( $session->amount_total ) ? (int) $session->amount_total : null,
			'currency'            => isset( $session->currency ) ? (string) $session->currency : '',
		);

		$encoded = wp_json_encode( $details );
		if ( false === $encoded ) {
			return new WP_REST_Response(
				array( 'message' => 'Failed to encode order details' ),
				500
			);
		}

		$updated = $wpdb->update(
			$table_name,
			array(
				'status'             => 'pending',
				'order_details_json' => $encoded,
			),
			array( 'id' => $order_id ),
			array( '%s', '%s' ),
			array( '%d' )
		);

		if ( false === $updated ) {
			return new WP_REST_Response(
				array( 'message' => 'Failed to update order' ),
				500
			);
		}

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log(
				sprintf(
					'Mebuki PM: order %d status set to pending (checkout.session.completed).',
					$order_id
				)
			);
		}

		return new WP_REST_Response(
			array(
				'received'  => true,
				'order_id'  => $order_id,
				'status'    => 'pending',
			),
			200
		);
	}

	/**
	 * POST /orders/checkout — persist order (payment_pending) and return Stripe Checkout URL.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function create_order_checkout( WP_REST_Request $request ) {
		global $wpdb;

		if ( ! class_exists( '\Stripe\Stripe' ) ) {
			return new WP_Error(
				'mebuki_pm_stripe_missing',
				__( 'Stripe PHP SDK is not installed. Run composer require stripe/stripe-php in the plugin directory.', 'mebuki-portfolio-manager' ),
				array( 'status' => 500 )
			);
		}

		$table_name = $wpdb->prefix . 'mebuki_pm_orders';
		$params     = $request->get_json_params();
		if ( null === $params ) {
			$params = $request->get_params();
		}

		$user_id = isset( $params['user_id'] ) ? absint( $params['user_id'] ) : 0;
		$uuid    = isset( $params['uuid'] ) ? sanitize_text_field( wp_unslash( (string) $params['uuid'] ) ) : '';

		if ( 0 === $user_id ) {
			return new WP_Error(
				'mebuki_pm_user_id_required',
				__( 'user_id is required.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		if ( ! preg_match( '/^[a-f0-9-]{36}$/i', $uuid ) ) {
			return new WP_Error(
				'mebuki_pm_invalid_uuid',
				__( 'uuid must be a valid 36-char UUID string.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$order_details = array();
		if ( isset( $params['order_details'] ) && is_array( $params['order_details'] ) ) {
			$order_details = $params['order_details'];
		} elseif ( isset( $params['order_details_json'] ) && is_array( $params['order_details_json'] ) ) {
			$order_details = $params['order_details_json'];
		}

		$message = isset( $params['message'] ) ? sanitize_textarea_field( wp_unslash( (string) $params['message'] ) ) : '';
		if ( '' !== $message ) {
			$order_details['message'] = $message;
		}

		$encoded_details = wp_json_encode( $order_details );
		$client_name     = isset( $params['client_name'] ) ? sanitize_text_field( wp_unslash( (string) $params['client_name'] ) ) : '';
		$client_email    = isset( $params['client_email'] ) ? sanitize_email( wp_unslash( (string) $params['client_email'] ) ) : '';
		$total_amount    = isset( $params['total_amount'] ) ? absint( $params['total_amount'] ) : 0;

		if ( false === $encoded_details ) {
			return new WP_Error(
				'mebuki_pm_order_json_encode_failed',
				__( 'Failed to encode order_details.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		if ( '' === $client_name || '' === $client_email || ! is_email( $client_email ) ) {
			return new WP_Error(
				'mebuki_pm_invalid_order_input',
				__( 'client_name and valid client_email are required.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		if ( $total_amount < 50 ) {
			return new WP_Error(
				'mebuki_pm_invalid_amount',
				__( 'total_amount must be at least 50 (JPY) for Stripe Checkout.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$stripe_secret = self::get_stripe_secret_key_for_user( $user_id );
		if ( '' === $stripe_secret ) {
			return new WP_Error(
				'mebuki_pm_stripe_not_configured',
				__( 'Stripe secret key is not configured for this site.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$existing = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE uuid = %s LIMIT 1",
				$uuid
			),
			ARRAY_A
		);

		if ( ! empty( $existing ) && (int) $existing['user_id'] !== $user_id ) {
			return new WP_Error(
				'mebuki_pm_uuid_conflict',
				__( 'This uuid is already associated with another portfolio.', 'mebuki-portfolio-manager' ),
				array( 'status' => 409 )
			);
		}

		if ( empty( $existing ) ) {
			$inserted = $wpdb->insert(
				$table_name,
				array(
					'user_id'            => $user_id,
					'uuid'               => $uuid,
					'client_name'        => $client_name,
					'client_email'       => $client_email,
					'status'             => 'payment_pending',
					'total_amount'       => $total_amount,
					'order_details_json' => $encoded_details,
				),
				array( '%d', '%s', '%s', '%s', '%s', '%d', '%s' )
			);

			if ( false === $inserted ) {
				$existing = $wpdb->get_row(
					$wpdb->prepare(
						"SELECT * FROM {$table_name} WHERE uuid = %s LIMIT 1",
						$uuid
					),
					ARRAY_A
				);
				if ( empty( $existing ) || (int) $existing['user_id'] !== $user_id ) {
					return new WP_Error(
						'mebuki_pm_order_insert_failed',
						__( 'Failed to create order.', 'mebuki-portfolio-manager' ),
						array( 'status' => 500 )
					);
				}
			}
		}

		$upd = $wpdb->update(
			$table_name,
			array(
				'client_name'        => $client_name,
				'client_email'       => $client_email,
				'status'             => 'payment_pending',
				'total_amount'       => $total_amount,
				'order_details_json' => $encoded_details,
			),
			array( 'uuid' => $uuid ),
			array( '%s', '%s', '%s', '%d', '%s' ),
			array( '%s' )
		);

		if ( false === $upd ) {
			return new WP_Error(
				'mebuki_pm_order_update_failed',
				__( 'Failed to update order before checkout.', 'mebuki-portfolio-manager' ),
				array( 'status' => 500 )
			);
		}

		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE uuid = %s LIMIT 1",
				$uuid
			),
			ARRAY_A
		);

		if ( empty( $row ) || ! isset( $row['id'] ) ) {
			return new WP_Error(
				'mebuki_pm_order_missing',
				__( 'Order row could not be loaded.', 'mebuki-portfolio-manager' ),
				array( 'status' => 500 )
			);
		}

		$order_id = (int) $row['id'];

		$site_url = home_url( '/' );
		$success_url = add_query_arg(
			array(
				'payment'    => 'success',
				'order_uuid' => $uuid,
			),
			$site_url
		);
		$cancel_url  = add_query_arg( array( 'payment' => 'cancel' ), $site_url );

		\Stripe\Stripe::setApiKey( $stripe_secret );

		try {
			$session = \Stripe\Checkout\Session::create(
				array(
					'mode'                 => 'payment',
					'payment_method_types' => array( 'card' ),
					'client_reference_id' => $uuid,
					'customer_email'      => $client_email,
					'line_items'          => array(
						array(
							'quantity'   => 1,
							'price_data' => array(
								'currency'     => 'jpy',
								'unit_amount'  => $total_amount,
								'product_data' => array(
									'name' => __( 'Mebuki Works 制作料金', 'mebuki-portfolio-manager' ),
								),
							),
						),
					),
					'success_url' => $success_url,
					'cancel_url'  => $cancel_url,
					'metadata'    => array(
						'order_id' => (string) $order_id,
					),
				)
			);
		} catch ( \Stripe\Exception\ApiErrorException $e ) {
			return new WP_Error(
				'mebuki_pm_stripe_api_error',
				$e->getMessage(),
				array( 'status' => 502 )
			);
		} catch ( \Exception $e ) {
			return new WP_Error(
				'mebuki_pm_stripe_error',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}

		if ( empty( $session->url ) ) {
			return new WP_Error(
				'mebuki_pm_stripe_no_url',
				__( 'Stripe did not return a checkout URL.', 'mebuki-portfolio-manager' ),
				array( 'status' => 502 )
			);
		}

		return rest_ensure_response(
			array(
				'success'       => true,
				'checkout_url'  => $session->url,
				'order'         => self::normalize_order_row( $row ),
				'stripe_session_id' => isset( $session->id ) ? $session->id : '',
			)
		);
	}

	/**
	 * GET /orders/me — orders owned by current user (portfolio owner).
	 *
	 * @return WP_REST_Response
	 */
	public static function list_orders_for_owner() {
		global $wpdb;

		$table_name = $wpdb->prefix . 'mebuki_pm_orders';
		$user_id    = get_current_user_id();

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE user_id = %d ORDER BY created_at DESC",
				$user_id
			),
			ARRAY_A
		);

		if ( ! is_array( $rows ) ) {
			$rows = array();
		}

		$orders = array_map( array( __CLASS__, 'normalize_order_row' ), $rows );

		return rest_ensure_response(
			array(
				'orders' => $orders,
			)
		);
	}

	/**
	 * PATCH /orders/{id} — update workflow status (Kanban).
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function patch_order_status( WP_REST_Request $request ) {
		global $wpdb;

		$table_name = $wpdb->prefix . 'mebuki_pm_orders';
		$order_id   = (int) $request->get_param( 'id' );
		$owner_id   = get_current_user_id();

		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE id = %d LIMIT 1",
				$order_id
			),
			ARRAY_A
		);

		if ( empty( $row ) || (int) $row['user_id'] !== $owner_id ) {
			return new WP_Error(
				'mebuki_pm_order_not_found',
				__( 'Order not found.', 'mebuki-portfolio-manager' ),
				array( 'status' => 404 )
			);
		}

		$params = $request->get_json_params();
		if ( null === $params ) {
			$params = $request->get_params();
		}

		$new_status = isset( $params['status'] ) ? sanitize_key( wp_unslash( (string) $params['status'] ) ) : '';
		$allowed    = array( 'pending', 'in_progress', 'completed' );
		if ( ! in_array( $new_status, $allowed, true ) ) {
			return new WP_Error(
				'mebuki_pm_invalid_order_status',
				__( 'status must be one of: pending, in_progress, completed.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$result = $wpdb->update(
			$table_name,
			array( 'status' => $new_status ),
			array( 'id' => $order_id ),
			array( '%s' ),
			array( '%d' )
		);

		if ( false === $result ) {
			return new WP_Error(
				'mebuki_pm_order_update_failed',
				__( 'Failed to update order.', 'mebuki-portfolio-manager' ),
				array( 'status' => 500 )
			);
		}

		$fresh = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE id = %d LIMIT 1",
				$order_id
			),
			ARRAY_A
		);

		return rest_ensure_response(
			array(
				'success' => true,
				'order'   => self::normalize_order_row( $fresh ),
			)
		);
	}

	/**
	 * POST /reviews
	 *
	 * Public endpoint for review submission.
	 * Initial status is always pending.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function create_review( WP_REST_Request $request ) {
		global $wpdb;

		$table_name = $wpdb->prefix . 'mebuki_pm_reviews';
		$params     = $request->get_json_params();
		if ( null === $params ) {
			$params = $request->get_params();
		}

		$user_id                = isset( $params['user_id'] ) ? absint( $params['user_id'] ) : 0;
		$item_type              = isset( $params['item_type'] ) ? sanitize_key( wp_unslash( (string) $params['item_type'] ) ) : '';
		$item_id                = isset( $params['item_id'] ) ? sanitize_text_field( wp_unslash( (string) $params['item_id'] ) ) : '';
		$reviewer_name          = isset( $params['reviewer_name'] ) ? sanitize_text_field( wp_unslash( (string) $params['reviewer_name'] ) ) : '';
		$reviewer_thumbnail_url = isset( $params['reviewer_thumbnail_url'] ) ? esc_url_raw( wp_unslash( (string) $params['reviewer_thumbnail_url'] ) ) : '';
		$review_text            = isset( $params['review_text'] ) ? sanitize_textarea_field( wp_unslash( (string) $params['review_text'] ) ) : '';

		if ( 0 === $user_id || '' === $item_type || '' === $item_id || '' === $reviewer_name || '' === $review_text ) {
			return new WP_Error(
				'mebuki_pm_invalid_review_input',
				__( 'user_id, item_type, item_id, reviewer_name, review_text are required.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$inserted = $wpdb->insert(
			$table_name,
			array(
				'user_id'                => $user_id,
				'item_type'              => $item_type,
				'item_id'                => $item_id,
				'reviewer_name'          => $reviewer_name,
				'reviewer_thumbnail_url' => $reviewer_thumbnail_url,
				'review_text'            => $review_text,
				'status'                 => 'pending',
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		if ( false === $inserted ) {
			return new WP_Error(
				'mebuki_pm_review_insert_failed',
				__( 'Failed to create review.', 'mebuki-portfolio-manager' ),
				array( 'status' => 500 )
			);
		}

		$created = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE id = %d LIMIT 1",
				(int) $wpdb->insert_id
			),
			ARRAY_A
		);

		return rest_ensure_response(
			array(
				'success' => true,
				'review'  => $created,
			)
		);
	}

	/**
	 * GET /reviews/me — reviews where current user is the portfolio owner (user_id).
	 *
	 * @return WP_REST_Response
	 */
	public static function list_reviews_for_owner() {
		global $wpdb;

		$table_name = $wpdb->prefix . 'mebuki_pm_reviews';
		$user_id    = get_current_user_id();

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT id, user_id, item_type, item_id, reviewer_name, reviewer_thumbnail_url, review_text, status, created_at, updated_at
				FROM {$table_name} WHERE user_id = %d ORDER BY created_at DESC",
				$user_id
			),
			ARRAY_A
		);

		if ( ! is_array( $rows ) ) {
			$rows = array();
		}

		$reviews = array_map( array( __CLASS__, 'normalize_review_row' ), $rows );

		return rest_ensure_response(
			array(
				'reviews' => $reviews,
			)
		);
	}

	/**
	 * GET /reviews/published?user_id= — public list of published reviews for a portfolio owner.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function list_published_reviews_for_user( WP_REST_Request $request ) {
		global $wpdb;

		$user_id = absint( $request->get_param( 'user_id' ) );
		if ( 0 === $user_id ) {
			return new WP_Error(
				'mebuki_pm_invalid_user',
				__( 'user_id is required.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$table_name = $wpdb->prefix . 'mebuki_pm_reviews';

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT id, user_id, item_type, item_id, reviewer_name, reviewer_thumbnail_url, review_text, status, created_at, updated_at
				FROM {$table_name} WHERE user_id = %d AND status = %s ORDER BY created_at DESC",
				$user_id,
				'published'
			),
			ARRAY_A
		);

		if ( ! is_array( $rows ) ) {
			$rows = array();
		}

		$reviews = array_map( array( __CLASS__, 'normalize_review_row' ), $rows );

		return rest_ensure_response(
			array(
				'reviews' => $reviews,
			)
		);
	}

	/**
	 * PATCH /reviews/{id} — set visibility (published / private) for owner's review row.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function patch_review_visibility( WP_REST_Request $request ) {
		global $wpdb;

		$table_name = $wpdb->prefix . 'mebuki_pm_reviews';
		$review_id  = (int) $request->get_param( 'id' );
		$owner_id   = get_current_user_id();

		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE id = %d LIMIT 1",
				$review_id
			),
			ARRAY_A
		);

		if ( empty( $row ) || (int) $row['user_id'] !== $owner_id ) {
			return new WP_Error(
				'mebuki_pm_review_not_found',
				__( 'Review not found.', 'mebuki-portfolio-manager' ),
				array( 'status' => 404 )
			);
		}

		$params = $request->get_json_params();
		if ( null === $params ) {
			$params = $request->get_params();
		}

		$visibility = isset( $params['visibility'] ) ? sanitize_key( wp_unslash( (string) $params['visibility'] ) ) : '';
		if ( ! in_array( $visibility, array( 'public', 'private' ), true ) ) {
			return new WP_Error(
				'mebuki_pm_invalid_visibility',
				__( 'visibility must be "public" or "private".', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$new_status = ( 'public' === $visibility ) ? 'published' : 'private';

		$updated = $wpdb->update(
			$table_name,
			array( 'status' => $new_status ),
			array( 'id' => $review_id ),
			array( '%s' ),
			array( '%d' )
		);

		if ( false === $updated ) {
			return new WP_Error(
				'mebuki_pm_review_update_failed',
				__( 'Failed to update review.', 'mebuki-portfolio-manager' ),
				array( 'status' => 500 )
			);
		}

		$fresh = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE id = %d LIMIT 1",
				$review_id
			),
			ARRAY_A
		);

		return rest_ensure_response(
			array(
				'success' => true,
				'review'  => self::normalize_review_row( $fresh ),
			)
		);
	}

	/**
	 * Normalize review row for REST.
	 *
	 * @param array|null $row DB row.
	 * @return array
	 */
	public static function normalize_review_row( $row ) {
		if ( empty( $row ) || ! is_array( $row ) ) {
			return array();
		}

		return array(
			'id'                     => isset( $row['id'] ) ? (int) $row['id'] : 0,
			'user_id'                => isset( $row['user_id'] ) ? (int) $row['user_id'] : 0,
			'item_type'              => isset( $row['item_type'] ) ? $row['item_type'] : '',
			'item_id'                => isset( $row['item_id'] ) ? $row['item_id'] : '',
			'reviewer_name'          => isset( $row['reviewer_name'] ) ? $row['reviewer_name'] : '',
			'reviewer_thumbnail_url' => isset( $row['reviewer_thumbnail_url'] ) ? $row['reviewer_thumbnail_url'] : '',
			'review_text'            => isset( $row['review_text'] ) ? $row['review_text'] : '',
			'status'                 => isset( $row['status'] ) ? $row['status'] : '',
			'created_at'             => isset( $row['created_at'] ) ? $row['created_at'] : null,
			'updated_at'             => isset( $row['updated_at'] ) ? $row['updated_at'] : null,
		);
	}

	/**
	 * Normalize order row payload.
	 *
	 * @param array|null $row DB row.
	 * @return array
	 */
	private static function normalize_order_row( $row ) {
		if ( empty( $row ) || ! is_array( $row ) ) {
			return array();
		}

		$decoded = json_decode( $row['order_details_json'] );
		if ( null === $decoded && 'null' !== strtolower( trim( (string) $row['order_details_json'] ) ) ) {
			$decoded = (object) array();
		}

		return array(
			'id'            => isset( $row['id'] ) ? (int) $row['id'] : 0,
			'user_id'       => isset( $row['user_id'] ) ? (int) $row['user_id'] : 0,
			'uuid'          => isset( $row['uuid'] ) ? $row['uuid'] : '',
			'client_name'   => isset( $row['client_name'] ) ? $row['client_name'] : '',
			'client_email'  => isset( $row['client_email'] ) ? $row['client_email'] : '',
			'status'        => isset( $row['status'] ) ? $row['status'] : '',
			'total_amount'  => isset( $row['total_amount'] ) ? (int) $row['total_amount'] : 0,
			'order_details' => $decoded,
			'created_at'    => isset( $row['created_at'] ) ? $row['created_at'] : null,
		);
	}
}


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
					'permission_callback' => array( __CLASS__, 'check_portfolio_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'save_settings' ),
					'permission_callback' => array( __CLASS__, 'check_portfolio_permission' ),
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
				'permission_callback' => array( __CLASS__, 'check_portfolio_permission' ),
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/orders/(?P<id>[\d]+)',
			array(
				'methods'             => 'PATCH',
				'callback'            => array( __CLASS__, 'patch_order_status' ),
				'permission_callback' => array( __CLASS__, 'check_portfolio_permission' ),
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
				'permission_callback' => array( __CLASS__, 'check_portfolio_permission' ),
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/reviews/reorder',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'reorder_reviews' ),
				'permission_callback' => array( __CLASS__, 'check_portfolio_permission' ),
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
					'user_slug' => array(
						'required'          => true,
						'validate_callback' => static function ( $v ) {
							return is_string( $v );
						},
					),
				),
			)
		);

		register_rest_route(
			'mebuki-pm/v1',
			'/reviews/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => 'PATCH',
					'callback'            => array( __CLASS__, 'patch_review_visibility' ),
					'permission_callback' => array( __CLASS__, 'check_portfolio_permission' ),
					'args'                => array(
						'id' => array(
							'required'          => true,
							'validate_callback' => static function ( $v ) {
								return is_numeric( $v ) && (int) $v > 0;
							},
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'delete_review' ),
					'permission_callback' => array( __CLASS__, 'check_portfolio_permission' ),
					'args'                => array(
						'id' => array(
							'required'          => true,
							'validate_callback' => static function ( $v ) {
								return is_numeric( $v ) && (int) $v > 0;
							},
						),
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

		$nonce_result = self::verify_rest_nonce( $request );
		if ( is_wp_error( $nonce_result ) ) {
			return $nonce_result;
		}

		return true;
	}

	/**
	 * Permission callback for portfolio owner operations.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return true|WP_Error
	 */
	public static function check_portfolio_permission( WP_REST_Request $request ) {
		$allowed = current_user_can( 'manage_options' ) || current_user_can( 'mebuki_manage_portfolio' );
		if ( ! $allowed ) {
			return new WP_Error(
				'mebuki_pm_forbidden',
				__( 'You do not have permission to access this endpoint.', 'mebuki-portfolio-manager' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$nonce_result = self::verify_rest_nonce( $request );
		if ( is_wp_error( $nonce_result ) ) {
			return $nonce_result;
		}

		return true;
	}

	/**
	 * Verify X-WP-Nonce header when provided.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return true|WP_Error
	 */
	private static function verify_rest_nonce( WP_REST_Request $request ) {
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

		$user_id = self::resolve_public_owner_user_id( $params );
		$uuid    = isset( $params['uuid'] ) ? sanitize_text_field( wp_unslash( (string) $params['uuid'] ) ) : '';

		if ( 0 === $user_id ) {
			return new WP_Error(
				'mebuki_pm_user_id_required',
				__( 'valid user_slug is required.', 'mebuki-portfolio-manager' ),
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
			if ( (int) $existing['user_id'] !== $user_id ) {
				return new WP_Error(
					'mebuki_pm_uuid_conflict',
					__( 'This uuid is already associated with another portfolio.', 'mebuki-portfolio-manager' ),
					array( 'status' => 409 )
				);
			}
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
		$normalized_order = self::normalize_order_row( $created );
		self::send_inquiry_confirmation_mail( $normalized_order );

		return rest_ensure_response(
			array(
				'success'    => true,
				'idempotent' => false,
				'order'      => $normalized_order,
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
	 * Resolve notification sender email from settings.
	 *
	 * @param int $user_id Portfolio owner user id.
	 * @return string
	 */
	private static function get_contact_sender_email_for_user( $user_id ) {
		$option = get_option( 'mebuki_pm_settings_' . absint( $user_id ), array() );
		if ( is_array( $option ) && isset( $option['admin_email'] ) && is_string( $option['admin_email'] ) ) {
			$admin_email = sanitize_email( $option['admin_email'] );
			if ( '' !== $admin_email && is_email( $admin_email ) ) {
				return $admin_email;
			}
		}
		return get_option( 'admin_email' );
	}

	/**
	 * Send confirmation mail to inquiry sender.
	 *
	 * @param array $order Normalized order row.
	 * @return void
	 */
	private static function send_inquiry_confirmation_mail( $order ) {
		if ( empty( $order ) || ! is_array( $order ) ) {
			return;
		}
		$to = isset( $order['client_email'] ) ? sanitize_email( (string) $order['client_email'] ) : '';
		if ( '' === $to || ! is_email( $to ) ) {
			return;
		}

		$user_id = isset( $order['user_id'] ) ? absint( $order['user_id'] ) : 0;
		if ( 0 === $user_id ) {
			return;
		}

		$site_name = wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
		$subject = sprintf( '[%s] お問い合わせを受け付けました', $site_name );
		$client_name = isset( $order['client_name'] ) ? trim( (string) $order['client_name'] ) : '';
		$uuid = isset( $order['uuid'] ) ? (string) $order['uuid'] : '';
		$total_amount = isset( $order['total_amount'] ) ? (int) $order['total_amount'] : 0;
		$name_label = '' !== $client_name ? $client_name . ' 様' : 'お客様';

		$lines = array(
			$name_label,
			'',
			'お問い合わせありがとうございます。',
			'以下の内容で受け付けました。',
			'',
			'受付番号: ' . $uuid,
			'合計金額: ¥' . number_format_i18n( $total_amount ),
			'',
			'内容を確認のうえ、追ってご連絡いたします。',
			'',
			'---',
			$site_name,
		);
		$message = implode( "\n", $lines );

		$sender = self::get_contact_sender_email_for_user( $user_id );
		$headers = array( 'Content-Type: text/plain; charset=UTF-8' );
		if ( '' !== $sender && is_email( $sender ) ) {
			$headers[] = 'Reply-To: ' . $sender;
		}

		wp_mail( $to, $subject, $message, $headers );
	}

	/**
	 * Resolve portfolio owner from public identifier.
	 *
	 * @param array $params Request params.
	 * @return int
	 */
	private static function resolve_public_owner_user_id( $params ) {
		if ( isset( $params['user_slug'] ) && is_string( $params['user_slug'] ) ) {
			$slug = sanitize_title( $params['user_slug'] );
			if ( '' !== $slug ) {
				$user = get_user_by( 'slug', $slug );
				if ( $user instanceof WP_User ) {
					return (int) $user->ID;
				}
				return 0;
			}
		}

		return 0;
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
	 * Resolve public portfolio URL for the specified owner.
	 *
	 * @param int $user_id Portfolio owner user id.
	 * @return string
	 */
	private static function get_portfolio_url_for_user( $user_id ) {
		$user = get_userdata( (int) $user_id );
		if ( ! $user instanceof WP_User ) {
			return home_url( '/' );
		}

		$user_slug = sanitize_title( (string) $user->user_nicename );
		if ( '' === $user_slug ) {
			return home_url( '/' );
		}

		return home_url( '/' . Mebuki_PM_Frontend::BASE_PATH . '/' . $user_slug . '/' );
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
	 * Read owner_id candidate from raw webhook payload.
	 *
	 * @param string $payload Raw request body.
	 * @return int
	 */
	private static function extract_owner_id_from_webhook_payload( $payload ) {
		$data = json_decode( $payload, true );
		if ( ! is_array( $data ) ) {
			return 0;
		}
		$owner_id = $data['data']['object']['metadata']['owner_id'] ?? null;
		if ( null === $owner_id ) {
			return 0;
		}
		return absint( $owner_id );
	}

	/**
	 * Read metadata field from Stripe checkout session object.
	 *
	 * @param mixed  $metadata Stripe metadata object/array.
	 * @param string $key Metadata key.
	 * @return string
	 */
	private static function read_stripe_metadata_value( $metadata, $key ) {
		if ( is_object( $metadata ) && isset( $metadata->{$key} ) ) {
			return (string) $metadata->{$key};
		}
		if ( is_array( $metadata ) && isset( $metadata[ $key ] ) ) {
			return (string) $metadata[ $key ];
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

		$payload_owner_id = self::extract_owner_id_from_webhook_payload( $payload );
		$secret_owner_id  = $payload_owner_id > 0 ? $payload_owner_id : self::get_portfolio_owner_user_id();
		$webhook_secret   = self::get_stripe_webhook_secret_for_user( $secret_owner_id );
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
		$oid_raw = self::read_stripe_metadata_value( $meta, 'order_id' );
		$event_owner_id = absint( self::read_stripe_metadata_value( $meta, 'owner_id' ) );

		$order_id = absint( $oid_raw );
		if ( $order_id <= 0 ) {
			return new WP_REST_Response( array( 'received' => true, 'skipped' => 'no_order_id' ), 200 );
		}
		if ( $event_owner_id <= 0 ) {
			return new WP_REST_Response( array( 'received' => true, 'skipped' => 'missing_owner_id' ), 200 );
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

		$row_owner_id = isset( $row['user_id'] ) ? (int) $row['user_id'] : 0;
		if ( $row_owner_id !== $event_owner_id ) {
			return new WP_REST_Response( array( 'received' => true, 'skipped' => 'owner_mismatch' ), 200 );
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

		$user_id = self::resolve_public_owner_user_id( $params );
		$uuid    = isset( $params['uuid'] ) ? sanitize_text_field( wp_unslash( (string) $params['uuid'] ) ) : '';

		if ( 0 === $user_id ) {
			return new WP_Error(
				'mebuki_pm_user_id_required',
				__( 'valid user_slug is required.', 'mebuki-portfolio-manager' ),
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

		$site_url = self::get_portfolio_url_for_user( $user_id );
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
						'owner_id' => (string) $user_id,
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
	 * Save a reviewer avatar for public review submission (multipart).
	 *
	 * Uses sideload so CLI/tests can supply temp files without is_uploaded_file().
	 *
	 * @param array $file            REST file entry (name, type, tmp_name, error, size).
	 * @param int   $owner_user_id   Portfolio owner id (upload path namespace).
	 * @return string|WP_Error       Escaped URL or error.
	 */
	private static function sideload_public_reviewer_avatar( array $file, $owner_user_id ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';

		$err = isset( $file['error'] ) ? (int) $file['error'] : UPLOAD_ERR_OK;
		if ( UPLOAD_ERR_OK !== $err ) {
			return new WP_Error(
				'mebuki_pm_review_avatar_upload_err',
				__( 'Image upload failed.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$tmp = isset( $file['tmp_name'] ) ? (string) $file['tmp_name'] : '';
		if ( '' === $tmp || ! file_exists( $tmp ) ) {
			return new WP_Error(
				'mebuki_pm_review_avatar_missing',
				__( 'Invalid image file.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$size = isset( $file['size'] ) ? (int) $file['size'] : 0;
		$max  = 2 * MB_IN_BYTES;
		if ( $size <= 0 || $size > $max ) {
			return new WP_Error(
				'mebuki_pm_review_avatar_too_large',
				__( 'Image must be 2MB or smaller.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$name     = isset( $file['name'] ) ? (string) $file['name'] : 'avatar.bin';
		$filetype = wp_check_filetype_and_ext( $tmp, $name );
		$ext      = isset( $filetype['ext'] ) ? strtolower( (string) $filetype['ext'] ) : '';
		$type     = isset( $filetype['type'] ) ? (string) $filetype['type'] : '';
		$allowed  = array( 'jpg', 'jpeg', 'png', 'gif', 'webp' );
		if ( '' === $ext || ! in_array( $ext, $allowed, true ) || ! preg_match( '#^image/#', $type ) ) {
			return new WP_Error(
				'mebuki_pm_review_avatar_type',
				__( 'Use JPG, PNG, GIF, or WebP.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$subdir_filter = static function ( $dirs ) use ( $owner_user_id ) {
			$subdir         = '/mebuki-pm/reviewer-avatars/' . absint( $owner_user_id );
			$dirs['subdir'] = $subdir;
			$dirs['path']   = $dirs['basedir'] . $subdir;
			$dirs['url']    = $dirs['baseurl'] . $subdir;
			return $dirs;
		};
		add_filter( 'upload_dir', $subdir_filter );

		$file_array = array(
			'name'     => sanitize_file_name( $name ),
			'type'     => $type,
			'tmp_name' => $tmp,
			'error'    => 0,
			'size'     => $size,
		);

		$overrides = array(
			'test_form' => false,
			'mimes'     => array(
				'jpg|jpeg|jpe' => 'image/jpeg',
				'gif'          => 'image/gif',
				'png'          => 'image/png',
				'webp'         => 'image/webp',
			),
		);

		$move = wp_handle_sideload( $file_array, $overrides );

		remove_filter( 'upload_dir', $subdir_filter );

		if ( isset( $move['error'] ) ) {
			$msg = is_string( $move['error'] ) ? $move['error'] : __( 'Could not save image.', 'mebuki-portfolio-manager' );
			return new WP_Error(
				'mebuki_pm_review_avatar_sideload',
				$msg,
				array( 'status' => 400 )
			);
		}

		$url = isset( $move['url'] ) ? esc_url_raw( (string) $move['url'] ) : '';
		if ( '' === $url || strlen( $url ) > 500 ) {
			if ( isset( $move['file'] ) && is_string( $move['file'] ) && file_exists( $move['file'] ) ) {
				wp_delete_file( $move['file'] );
			}
			return new WP_Error(
				'mebuki_pm_review_avatar_url',
				__( 'Could not save image.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		return $url;
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

		$user_id                = self::resolve_public_owner_user_id( $params );
		$item_type              = isset( $params['item_type'] ) ? sanitize_key( wp_unslash( (string) $params['item_type'] ) ) : '';
		$item_id                = isset( $params['item_id'] ) ? sanitize_text_field( wp_unslash( (string) $params['item_id'] ) ) : '';
		$reviewer_name          = isset( $params['reviewer_name'] ) ? sanitize_text_field( wp_unslash( (string) $params['reviewer_name'] ) ) : '';
		$reviewer_thumbnail_url = isset( $params['reviewer_thumbnail_url'] ) ? esc_url_raw( wp_unslash( (string) $params['reviewer_thumbnail_url'] ) ) : '';
		$review_text            = isset( $params['review_text'] ) ? sanitize_textarea_field( wp_unslash( (string) $params['review_text'] ) ) : '';

		if ( 0 === $user_id || '' === $item_type || '' === $item_id || '' === $reviewer_name || '' === $review_text ) {
			return new WP_Error(
				'mebuki_pm_invalid_review_input',
				__( 'valid user_slug, item_type, item_id, reviewer_name, review_text are required.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$files = $request->get_file_params();
		if ( ! empty( $files['reviewer_avatar'] ) && is_array( $files['reviewer_avatar'] ) ) {
			$uploaded = self::sideload_public_reviewer_avatar( $files['reviewer_avatar'], $user_id );
			if ( is_wp_error( $uploaded ) ) {
				return $uploaded;
			}
			$reviewer_thumbnail_url = $uploaded;
		}

		$next_sort = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COALESCE(MAX(sort_order), -1) + 1 FROM {$table_name} WHERE user_id = %d",
				$user_id
			)
		);

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
				'sort_order'             => $next_sort,
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d' )
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
				'review'  => self::normalize_review_row( $created ),
			)
		);
	}

	/**
	 * POST /reviews/reorder — set display order for all of the current user's reviews.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function reorder_reviews( WP_REST_Request $request ) {
		global $wpdb;

		$table_name = $wpdb->prefix . 'mebuki_pm_reviews';
		$owner_id   = get_current_user_id();

		$params = $request->get_json_params();
		if ( null === $params ) {
			$params = $request->get_params();
		}

		$order = isset( $params['order'] ) && is_array( $params['order'] ) ? $params['order'] : null;
		if ( null === $order ) {
			return new WP_Error(
				'mebuki_pm_review_reorder_invalid',
				__( 'order must be a non-empty array of review ids.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$ids = array();
		foreach ( $order as $raw ) {
			$ids[] = absint( $raw );
		}
		$ids = array_values( array_filter( $ids ) );
		if ( array() === $ids ) {
			return new WP_Error(
				'mebuki_pm_review_reorder_invalid',
				__( 'order must be a non-empty array of review ids.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$ids_unique = array_values( array_unique( $ids ) );
		if ( count( $ids ) !== count( $ids_unique ) ) {
			return new WP_Error(
				'mebuki_pm_review_reorder_invalid',
				__( 'order must not contain duplicate ids.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$db_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT id FROM {$table_name} WHERE user_id = %d",
				$owner_id
			)
		);
		if ( ! is_array( $db_ids ) ) {
			$db_ids = array();
		}
		$db_ids = array_map( 'intval', $db_ids );
		sort( $db_ids );
		$incoming = array_map( 'intval', $ids_unique );
		sort( $incoming );
		if ( $db_ids !== $incoming ) {
			return new WP_Error(
				'mebuki_pm_review_reorder_invalid',
				__( 'order must list every review id for this portfolio exactly once.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$wpdb->query( 'START TRANSACTION' );
		$ok = true;
		foreach ( $ids as $position => $rid ) {
			$updated = $wpdb->update(
				$table_name,
				array( 'sort_order' => (int) $position ),
				array(
					'id'      => (int) $rid,
					'user_id' => $owner_id,
				),
				array( '%d' ),
				array( '%d', '%d' )
			);
			if ( false === $updated ) {
				$ok = false;
				break;
			}
		}
		if ( ! $ok ) {
			$wpdb->query( 'ROLLBACK' );
			return new WP_Error(
				'mebuki_pm_review_reorder_failed',
				__( 'Failed to save review order.', 'mebuki-portfolio-manager' ),
				array( 'status' => 500 )
			);
		}
		$wpdb->query( 'COMMIT' );

		return rest_ensure_response(
			array(
				'success' => true,
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
				"SELECT id, user_id, item_type, item_id, reviewer_name, reviewer_thumbnail_url, review_text, status, sort_order, created_at, updated_at
				FROM {$table_name} WHERE user_id = %d ORDER BY sort_order ASC, id ASC",
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

		$params = $request->get_params();
		$user_id = self::resolve_public_owner_user_id( $params );
		if ( 0 === $user_id ) {
			return new WP_Error(
				'mebuki_pm_invalid_user',
				__( 'valid user_slug is required.', 'mebuki-portfolio-manager' ),
				array( 'status' => 400 )
			);
		}

		$table_name = $wpdb->prefix . 'mebuki_pm_reviews';

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT id, user_id, item_type, item_id, reviewer_name, reviewer_thumbnail_url, review_text, status, sort_order, created_at, updated_at
				FROM {$table_name} WHERE user_id = %d AND status = %s ORDER BY sort_order ASC, id ASC",
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
	 * If URL points at a plugin-managed reviewer avatar under uploads, delete the file.
	 *
	 * @param string $url Stored reviewer_thumbnail_url.
	 * @return void
	 */
	private static function maybe_delete_reviewer_avatar_file_for_url( $url ) {
		if ( ! is_string( $url ) ) {
			return;
		}
		$url = trim( $url );
		if ( '' === $url ) {
			return;
		}

		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) || '' === $upload_dir['basedir'] || '' === $upload_dir['baseurl'] ) {
			return;
		}

		$file_parsed = wp_parse_url( $url );
		$base_parsed = wp_parse_url( $upload_dir['baseurl'] );
		if ( empty( $file_parsed['path'] ) || empty( $base_parsed['host'] ) || empty( $base_parsed['path'] ) ) {
			return;
		}
		if ( empty( $file_parsed['host'] ) || strtolower( (string) $file_parsed['host'] ) !== strtolower( (string) $base_parsed['host'] ) ) {
			return;
		}

		$file_path = (string) $file_parsed['path'];
		$base_path = (string) $base_parsed['path'];
		if ( strpos( $file_path, $base_path ) !== 0 ) {
			return;
		}

		$relative = ltrim( substr( $file_path, strlen( $base_path ) ), '/' );
		if ( ! preg_match( '#^mebuki-pm/reviewer-avatars/\d+/#', $relative ) ) {
			return;
		}

		$candidate = wp_normalize_path( path_join( $upload_dir['basedir'], $relative ) );
		$basedir   = wp_normalize_path( $upload_dir['basedir'] );
		if ( strpos( $candidate, $basedir ) !== 0 ) {
			return;
		}
		if ( is_file( $candidate ) ) {
			wp_delete_file( $candidate );
		}
	}

	/**
	 * DELETE /reviews/{id} — remove a review row owned by the current user.
	 *
	 * @param WP_REST_Request $request Request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function delete_review( WP_REST_Request $request ) {
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

		$thumb = isset( $row['reviewer_thumbnail_url'] ) ? (string) $row['reviewer_thumbnail_url'] : '';
		self::maybe_delete_reviewer_avatar_file_for_url( $thumb );

		$deleted = $wpdb->delete(
			$table_name,
			array(
				'id'      => $review_id,
				'user_id' => $owner_id,
			),
			array( '%d', '%d' )
		);

		if ( false === $deleted || (int) $deleted < 1 ) {
			return new WP_Error(
				'mebuki_pm_review_delete_failed',
				__( 'Failed to delete review.', 'mebuki-portfolio-manager' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'id'      => $review_id,
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
			'sort_order'             => isset( $row['sort_order'] ) ? (int) $row['sort_order'] : 0,
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


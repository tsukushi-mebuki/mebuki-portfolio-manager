<?php
/**
 * Public API tenant boundary hardening tests.
 */

if ( ! class_exists( '\Stripe\Webhook' ) ) {
	class Mebuki_PM_Test_Stripe_Webhook_Stub {
		/**
		 * Minimal stub for webhook signature construction in tests.
		 *
		 * @param string $payload Raw payload.
		 * @return object
		 * @throws UnexpectedValueException Invalid JSON payload.
		 */
		public static function constructEvent( $payload ) {
			$decoded = json_decode( $payload );
			if ( ! is_object( $decoded ) ) {
				throw new UnexpectedValueException( 'Invalid payload.' );
			}
			return $decoded;
		}
	}
	class_alias( 'Mebuki_PM_Test_Stripe_Webhook_Stub', 'Stripe\Webhook' );
}

class Test_API_Public_Tenant_Hardening extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private $user_a;

	/**
	 * @var int
	 */
	private $user_b;

	/**
	 * @var string
	 */
	private $slug_a;

	/**
	 * @var string
	 */
	private $slug_b;

	/**
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		Mebuki_PM_DB::migrate();

		$this->user_a = self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'owner_a',
			)
		);
		$this->user_b = self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'owner_b',
			)
		);

		$user_a = get_user_by( 'id', $this->user_a );
		$user_b = get_user_by( 'id', $this->user_b );
		$this->slug_a = $user_a instanceof WP_User ? (string) $user_a->user_nicename : '';
		$this->slug_b = $user_b instanceof WP_User ? (string) $user_b->user_nicename : '';
	}

	/**
	 * @return void
	 */
	public function test_public_post_without_slug_is_rejected_even_with_user_id() {
		$request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/reviews' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'user_id'      => $this->user_a,
					'item_type'    => 'youtube',
					'item_id'      => 'item-1',
					'reviewer_name'=> 'tester',
					'review_text'  => 'hello',
				)
			)
		);
		$response = rest_do_request( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * @return void
	 */
	public function test_public_checkout_without_slug_is_rejected_even_with_user_id() {
		$request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/orders/checkout' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'user_id'           => $this->user_a,
					'uuid'              => wp_generate_uuid4(),
					'client_name'       => 'Public User',
					'client_email'      => 'public@example.com',
					'total_amount'      => 1200,
					'order_details_json'=> array(
						'category_name' => 'cat',
						'course'        => array(
							'id'   => 'course-1',
							'name' => 'Course',
						),
						'options'       => array(),
					),
				)
			)
		);
		$response = rest_do_request( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * @return void
	 */
	public function test_public_order_uses_slug_owner_even_if_user_id_is_different() {
		$request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/orders' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'user_slug'         => $this->slug_b,
					'user_id'           => $this->user_a,
					'uuid'              => wp_generate_uuid4(),
					'client_name'       => 'Public User',
					'client_email'      => 'public@example.com',
					'message'           => 'test',
					'total_amount'      => 1200,
					'order_details_json'=> array(
						'category_name' => 'cat',
						'course'        => array(
							'id'   => 'course-1',
							'name' => 'Course',
						),
						'options'       => array(),
					),
				)
			)
		);
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( $this->user_b, (int) $data['order']['user_id'] );
	}

	/**
	 * @return void
	 */
	public function test_published_reviews_invalid_slug_returns_400() {
		$request = new WP_REST_Request( 'GET', '/mebuki-pm/v1/reviews/published' );
		$request->set_query_params( array( 'user_slug' => 'not-found-slug' ) );
		$response = rest_do_request( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * @return void
	 */
	public function test_published_reviews_without_slug_returns_400() {
		$request = new WP_REST_Request( 'GET', '/mebuki-pm/v1/reviews/published' );
		$response = rest_do_request( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * @return void
	 */
	public function test_webhook_owner_mismatch_is_skipped() {
		global $wpdb;
		$table = $wpdb->prefix . 'mebuki_pm_orders';

		update_option(
			'mebuki_pm_settings_' . $this->user_b,
			array( 'stripe_webhook_secret' => 'whsec_test_b' ),
			false
		);

		$uuid = wp_generate_uuid4();
		$wpdb->insert(
			$table,
			array(
				'user_id'            => $this->user_a,
				'uuid'               => $uuid,
				'client_name'        => 'Owner A',
				'client_email'       => 'a@example.com',
				'status'             => 'payment_pending',
				'total_amount'       => 3000,
				'order_details_json' => wp_json_encode( array() ),
			),
			array( '%d', '%s', '%s', '%s', '%s', '%d', '%s' )
		);
		$order_id = (int) $wpdb->insert_id;

		$payload = wp_json_encode(
			array(
				'type' => 'checkout.session.completed',
				'data' => array(
					'object' => array(
						'id'       => 'cs_test_123',
						'metadata' => array(
							'order_id' => (string) $order_id,
							'owner_id' => (string) $this->user_b,
						),
					),
				),
			)
		);

		$timestamp = time();
		$signature = hash_hmac( 'sha256', "{$timestamp}.{$payload}", 'whsec_test_b' );
		$request   = new WP_REST_Request( 'POST', '/mebuki-pm/v1/webhooks/stripe' );
		$request->set_header( 'stripe_signature', "t={$timestamp},v1={$signature}" );
		$request->set_body( $payload );
		$response = Mebuki_PM_API::handle_stripe_webhook( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'owner_mismatch', $data['skipped'] );

		$status_after = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT status FROM {$table} WHERE id = %d",
				$order_id
			)
		);
		$this->assertSame( 'payment_pending', $status_after );
	}

	/**
	 * @return void
	 */
	public function test_webhook_missing_owner_id_is_skipped() {
		global $wpdb;
		$table = $wpdb->prefix . 'mebuki_pm_orders';
		$owner_method = new ReflectionMethod( 'Mebuki_PM_API', 'get_portfolio_owner_user_id' );
		$owner_method->setAccessible( true );
		$fallback_owner_id = (int) $owner_method->invoke( null );

		update_option(
			'mebuki_pm_settings_' . $fallback_owner_id,
			array( 'stripe_webhook_secret' => 'whsec_test_a' ),
			false
		);

		$uuid = wp_generate_uuid4();
		$wpdb->insert(
			$table,
			array(
				'user_id'            => $this->user_a,
				'uuid'               => $uuid,
				'client_name'        => 'Owner A',
				'client_email'       => 'a@example.com',
				'status'             => 'payment_pending',
				'total_amount'       => 3000,
				'order_details_json' => wp_json_encode( array() ),
			),
			array( '%d', '%s', '%s', '%s', '%s', '%d', '%s' )
		);
		$order_id = (int) $wpdb->insert_id;

		$payload = wp_json_encode(
			array(
				'type' => 'checkout.session.completed',
				'data' => array(
					'object' => array(
						'id'       => 'cs_test_missing_owner',
						'metadata' => array(
							'order_id' => (string) $order_id,
						),
					),
				),
			)
		);

		$timestamp = time();
		$signature = hash_hmac( 'sha256', "{$timestamp}.{$payload}", 'whsec_test_a' );
		$request   = new WP_REST_Request( 'POST', '/mebuki-pm/v1/webhooks/stripe' );
		$request->set_header( 'stripe_signature', "t={$timestamp},v1={$signature}" );
		$request->set_body( $payload );
		$response = Mebuki_PM_API::handle_stripe_webhook( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'missing_owner_id', $data['skipped'] );

		$status_after = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT status FROM {$table} WHERE id = %d",
				$order_id
			)
		);
		$this->assertSame( 'payment_pending', $status_after );
	}

	/**
	 * @return void
	 */
	public function test_public_review_multipart_avatar_stores_url() {
		$png     = base64_decode( 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', true );
		$tmp     = wp_tempnam( 'mebuki_review_avatar' );
		$written = file_put_contents( $tmp, $png );
		$this->assertNotFalse( $tmp );
		$this->assertNotFalse( $written );

		$request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/reviews' );
		$request->set_body_params(
			array(
				'user_slug'     => $this->slug_a,
				'item_type'     => 'youtube',
				'item_id'       => 'vid-avatar-1',
				'reviewer_name' => 'Tester',
				'review_text'   => 'Great!',
			)
		);

		$refl = new ReflectionClass( $request );
		$prop = $refl->getProperty( 'file_params' );
		$prop->setAccessible( true );
		$prop->setValue(
			$request,
			array(
				'reviewer_avatar' => array(
					'name'     => 'avatar.png',
					'type'     => 'image/png',
					'tmp_name' => $tmp,
					'error'    => 0,
					'size'     => (int) filesize( $tmp ),
				),
			)
		);

		$response = rest_do_request( $request );

		if ( file_exists( $tmp ) ) {
			unlink( $tmp );
		}

		$this->assertSame( 200, $response->get_status(), wp_json_encode( $response->get_data() ) );
		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'review', $data );
		$url = isset( $data['review']['reviewer_thumbnail_url'] ) ? (string) $data['review']['reviewer_thumbnail_url'] : '';
		$this->assertNotSame( '', $url );
		$this->assertStringContainsString( 'mebuki-pm/reviewer-avatars/' . $this->user_a, $url );
	}
}

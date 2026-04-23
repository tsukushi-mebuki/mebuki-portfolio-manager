<?php
/**
 * API connectivity test for settings endpoint.
 */

class Test_API_Settings extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private $admin_user_id;

	/**
	 * Test setup.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		$this->admin_user_id = self::factory()->user->create(
			array(
				'role' => 'administrator',
			)
		);

		wp_set_current_user( $this->admin_user_id );
		Mebuki_PM_DB::migrate();
	}

	/**
	 * Ensure admin can reach settings API.
	 *
	 * @return void
	 */
	public function test_admin_can_get_settings_endpoint() {
		$request  = new WP_REST_Request( 'GET', '/mebuki-pm/v1/settings' );
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'settings', $data );
		$this->assertArrayHasKey( 'updated_at', $data );
	}

	/**
	 * /settings/me mirrors /settings for current user.
	 *
	 * @return void
	 */
	public function test_admin_can_get_settings_me_endpoint() {
		$request  = new WP_REST_Request( 'GET', '/mebuki-pm/v1/settings/me' );
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'settings', $data );
		$this->assertArrayHasKey( 'updated_at', $data );
	}

	/**
	 * Ensure admin can save settings and values are persisted.
	 *
	 * @return void
	 */
	public function test_admin_can_post_settings_successfully() {
		$payload = array(
			'api_key'  => 'test-api-key',
			'endpoint' => 'https://api.example.com/v1',
		);

		$request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/settings' );
		$request->set_body_params( $payload );

		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );

		$stored = get_option( 'mebuki_pm_settings_' . $this->admin_user_id );
		$this->assertIsArray( $stored );
		$this->assertSame( $payload['api_key'], $stored['api_key'] );
		$this->assertSame( $payload['endpoint'], $stored['endpoint'] );
	}

	/**
	 * Ensure credo fields and layout order are persisted correctly.
	 *
	 * @return void
	 */
	public function test_admin_can_save_credo_and_layout_order() {
		$payload = array(
			'layout_order' => array(
				'hero',
				'about',
				'credo',
				'pricing',
				'faq',
				'youtube_gallery',
				'illustration_gallery',
				'link_cards',
				'reviews',
			),
			'credo'        => array(
				'title' => 'Our Credo',
				'body'  => 'We value trust and craftsmanship.',
			),
		);

		$request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/settings' );
		$request->set_body_params( $payload );

		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'settings', $data );
		$this->assertEquals(
			$payload['layout_order'],
			(array) $data['settings']->layout_order
		);
		$this->assertSame( 'Our Credo', $data['settings']->credo->title );
		$this->assertSame(
			'We value trust and craftsmanship.',
			$data['settings']->credo->body
		);

		$stored = get_option( 'mebuki_pm_settings_' . $this->admin_user_id );
		$this->assertIsArray( $stored );
		$this->assertArrayHasKey( 'credo', $stored );
		$this->assertArrayHasKey( 'layout_order', $stored );
		$this->assertSame( 'Our Credo', $stored['credo']['title'] );
		$this->assertSame(
			'We value trust and craftsmanship.',
			$stored['credo']['body']
		);
		$this->assertEquals( $payload['layout_order'], $stored['layout_order'] );
	}

	/**
	 * /settings/me should also persist credo payload correctly.
	 *
	 * @return void
	 */
	public function test_admin_can_save_credo_via_settings_me_endpoint() {
		$payload = array(
			'credo' => array(
				'title' => '信条',
				'body'  => '丁寧な対話を大切にします。',
			),
		);

		$request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/settings/me' );
		$request->set_body_params( $payload );

		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$stored = get_option( 'mebuki_pm_settings_' . $this->admin_user_id );
		$this->assertIsArray( $stored );
		$this->assertArrayHasKey( 'credo', $stored );
		$this->assertSame( '信条', $stored['credo']['title'] );
		$this->assertSame(
			'丁寧な対話を大切にします。',
			$stored['credo']['body']
		);
	}

	/**
	 * Ensure invalid endpoint format is rejected.
	 *
	 * @return void
	 */
	public function test_post_settings_with_invalid_endpoint_returns_error() {
		$request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/settings' );
		$request->set_body_params(
			array(
				'api_key'  => 'test-api-key',
				'endpoint' => 'not-a-url',
			)
		);

		$response = rest_do_request( $request );

		$this->assertSame( 400, $response->get_status() );

		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'code', $data );
		$this->assertSame( 'mebuki_pm_invalid_endpoint', $data['code'] );
	}

	/**
	 * Ensure subscriber cannot access settings endpoint.
	 *
	 * @return void
	 */
	public function test_subscriber_is_rejected_for_get_and_post() {
		$subscriber_id = self::factory()->user->create(
			array(
				'role' => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$get_request  = new WP_REST_Request( 'GET', '/mebuki-pm/v1/settings' );
		$get_response = rest_do_request( $get_request );
		$this->assertContains( $get_response->get_status(), array( 401, 403 ) );

		$post_request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/settings' );
		$post_request->set_body_params(
			array(
				'api_key'  => 'blocked',
				'endpoint' => 'https://api.example.com',
			)
		);
		$post_response = rest_do_request( $post_request );
		$this->assertContains( $post_response->get_status(), array( 401, 403 ) );

		$get_data  = $get_response->get_data();
		$post_data = $post_response->get_data();
		$this->assertIsArray( $get_data );
		$this->assertIsArray( $post_data );
		$this->assertArrayHasKey( 'code', $get_data );
		$this->assertArrayHasKey( 'code', $post_data );
	}

	/**
	 * Ensure admin form-like payload is preserved across POST -> DB -> GET.
	 *
	 * @return void
	 */
	public function test_settings_me_roundtrip_preserves_admin_input_payload() {
		global $wpdb;

		$payload = array(
			'layout_order'             => array(
				'hero',
				'about',
				'credo',
				'youtube_gallery',
				'illustration_gallery',
				'link_cards',
				'pricing',
				'faq',
				'reviews',
			),
			'hero'                     => array(
				'title'               => '見出し',
				'subtitle'            => 'サブ',
				'cover_image_url'     => 'https://example.com/cover.jpg',
				'overlay_image_url'   => 'https://example.com/logo.png',
				'overlay_align'       => 'right',
			),
			'about'                    => array(
				'items' => array(
					array(
						'title'   => 'プロフィール',
						'content' => '音楽制作を担当しています。',
					),
				),
			),
			'credo'                    => array(
				'title' => '制作方針',
				'body'  => '丁寧なコミュニケーションを重視します。',
			),
			'youtube_gallery'          => array(
				'items' => array(
					array(
						'title'   => '歌ってみたMix',
						'url'     => 'https://www.youtube.com/watch?v=abc123',
						'item_id' => 'yt-item-001',
					),
				),
			),
			'illustration_gallery'     => array(
				'items' => array(
					array(
						'title'   => '立ち絵サンプル',
						'url'     => 'https://example.com/illust.webp',
						'item_id' => 'illust-item-001',
					),
				),
			),
			'link_cards'               => array(
				'items' => array(
					array(
						'title'         => 'X',
						'url'           => 'https://x.com/example',
						'thumbnail_url' => 'https://example.com/thumb.png',
					),
				),
			),
			'pricing'                  => array(
				'categories' => array(),
			),
			'faq'                      => array(
				'items' => array(
					array(
						'question' => '納期はどれくらいですか？',
						'answer'   => '通常7日です。',
					),
				),
			),
			'stripe_public_key'        => 'pk_test_123',
			'stripe_secret_key'        => 'sk_test_123',
			'stripe_webhook_secret'    => 'whsec_123',
			'admin_email'              => 'owner@example.com',
			'portfolio_site_url'       => 'https://portfolio.example.com',
			'review_fallback_icon_url' => 'https://example.com/reviewer.png',
			'show_reviews_under_items' => true,
		);

		$post_request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/settings/me' );
		$post_request->set_header( 'Content-Type', 'application/json' );
		$post_request->set_body( wp_json_encode( $payload ) );
		$post_response = rest_do_request( $post_request );
		$this->assertSame( 200, $post_response->get_status() );

		$table_name = $wpdb->prefix . 'mebuki_pm_settings';
		$row        = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT setting_json FROM {$table_name} WHERE user_id = %d ORDER BY id DESC LIMIT 1",
				$this->admin_user_id
			),
			ARRAY_A
		);
		$this->assertIsArray( $row );
		$this->assertArrayHasKey( 'setting_json', $row );
		$this->assertNotEmpty( $row['setting_json'] );

		$decoded = json_decode( $row['setting_json'], true );
		$this->assertIsArray( $decoded );
		$this->assertSame( '制作方針', $decoded['credo']['title'] );
		$this->assertSame( '見出し', $decoded['hero']['title'] );
		$this->assertSame( 'https://example.com/logo.png', $decoded['hero']['overlay_image_url'] );
		$this->assertSame( 'right', $decoded['hero']['overlay_align'] );
		$this->assertSame( 'yt-item-001', $decoded['youtube_gallery']['items'][0]['item_id'] );
		$this->assertTrue( (bool) $decoded['show_reviews_under_items'] );

		$get_request  = new WP_REST_Request( 'GET', '/mebuki-pm/v1/settings/me' );
		$get_response = rest_do_request( $get_request );
		$this->assertSame( 200, $get_response->get_status() );
		$data = $get_response->get_data();

		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'settings', $data );
		$this->assertSame( '制作方針', $data['settings']->credo->title );
		$this->assertSame( '見出し', $data['settings']->hero->title );
		$this->assertSame( 'https://example.com/logo.png', $data['settings']->hero->overlay_image_url );
		$this->assertSame( 'right', $data['settings']->hero->overlay_align );
		$this->assertSame(
			'yt-item-001',
			$data['settings']->youtube_gallery->items[0]->item_id
		);
		$this->assertSame(
			'https://portfolio.example.com',
			$data['settings']->portfolio_site_url
		);
		$this->assertTrue( (bool) $data['settings']->show_reviews_under_items );
	}
}

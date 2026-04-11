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
}

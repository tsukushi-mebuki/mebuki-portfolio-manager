<?php
/**
 * Portfolio editor permissions for own resources.
 */
class Test_API_Portfolio_Editor_Permissions extends WP_UnitTestCase {
	/**
	 * @var int
	 */
	private $editor_user_id;

	/**
	 * @var int
	 */
	private $other_user_id;

	/**
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		Mebuki_PM_DB::migrate();

		$this->editor_user_id = self::factory()->user->create(
			array(
				'role'       => 'portfolio_editor',
				'user_login' => 'portfolio_owner_a',
			)
		);
		$this->other_user_id = self::factory()->user->create(
			array(
				'role'       => 'portfolio_editor',
				'user_login' => 'portfolio_owner_b',
			)
		);
	}

	/**
	 * @return int
	 */
	private function insert_order_for_user( $user_id, $status = 'pending' ) {
		global $wpdb;
		$table = $wpdb->prefix . 'mebuki_pm_orders';
		$wpdb->insert(
			$table,
			array(
				'user_id'            => (int) $user_id,
				'uuid'               => wp_generate_uuid4(),
				'client_name'        => 'Client',
				'client_email'       => 'client@example.com',
				'status'             => $status,
				'total_amount'       => 10000,
				'order_details_json' => wp_json_encode( array( 'course' => 'basic' ) ),
			),
			array( '%d', '%s', '%s', '%s', '%s', '%d', '%s' )
		);
		return (int) $wpdb->insert_id;
	}

	/**
	 * @return int
	 */
	private function insert_review_for_user( $user_id, $status = 'pending' ) {
		global $wpdb;
		$table = $wpdb->prefix . 'mebuki_pm_reviews';
		$wpdb->insert(
			$table,
			array(
				'user_id'                => (int) $user_id,
				'item_type'              => 'youtube',
				'item_id'                => 'item-1',
				'reviewer_name'          => 'Reviewer',
				'reviewer_thumbnail_url' => '',
				'review_text'            => 'Great!',
				'status'                 => $status,
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s', '%s' )
		);
		return (int) $wpdb->insert_id;
	}

	/**
	 * @return void
	 */
	public function test_portfolio_editor_can_read_and_write_settings_me() {
		wp_set_current_user( $this->editor_user_id );

		$get_request  = new WP_REST_Request( 'GET', '/mebuki-pm/v1/settings/me' );
		$get_response = rest_do_request( $get_request );
		$this->assertSame( 200, $get_response->get_status() );

		$post_request = new WP_REST_Request( 'POST', '/mebuki-pm/v1/settings/me' );
		$post_request->set_body_params(
			array(
				'admin_email' => 'owner-a@example.com',
			)
		);
		$post_response = rest_do_request( $post_request );
		$this->assertSame( 200, $post_response->get_status() );

		$stored = get_option( 'mebuki_pm_settings_' . $this->editor_user_id );
		$this->assertIsArray( $stored );
		$this->assertSame( 'owner-a@example.com', $stored['admin_email'] );
	}

	/**
	 * @return void
	 */
	public function test_portfolio_editor_cannot_access_admin_settings_endpoint() {
		wp_set_current_user( $this->editor_user_id );
		$request  = new WP_REST_Request( 'GET', '/mebuki-pm/v1/settings' );
		$response = rest_do_request( $request );
		$this->assertContains( $response->get_status(), array( 401, 403 ) );
	}

	/**
	 * @return void
	 */
	public function test_portfolio_editor_can_operate_only_own_orders() {
		$own_order_id   = $this->insert_order_for_user( $this->editor_user_id, 'pending' );
		$other_order_id = $this->insert_order_for_user( $this->other_user_id, 'pending' );
		wp_set_current_user( $this->editor_user_id );

		$list_request  = new WP_REST_Request( 'GET', '/mebuki-pm/v1/orders/me' );
		$list_response = rest_do_request( $list_request );
		$this->assertSame( 200, $list_response->get_status() );
		$data = $list_response->get_data();
		$this->assertCount( 1, $data['orders'] );
		$this->assertSame( $own_order_id, (int) $data['orders'][0]['id'] );

		$patch_own = new WP_REST_Request( 'PATCH', '/mebuki-pm/v1/orders/' . $own_order_id );
		$patch_own->set_header( 'Content-Type', 'application/json' );
		$patch_own->set_body( wp_json_encode( array( 'status' => 'completed' ) ) );
		$patch_own_response = rest_do_request( $patch_own );
		$this->assertSame( 200, $patch_own_response->get_status() );

		$patch_other = new WP_REST_Request( 'PATCH', '/mebuki-pm/v1/orders/' . $other_order_id );
		$patch_other->set_header( 'Content-Type', 'application/json' );
		$patch_other->set_body( wp_json_encode( array( 'status' => 'completed' ) ) );
		$patch_other_response = rest_do_request( $patch_other );
		$this->assertSame( 404, $patch_other_response->get_status() );
	}

	/**
	 * @return void
	 */
	public function test_portfolio_editor_can_operate_only_own_reviews() {
		$own_review_id   = $this->insert_review_for_user( $this->editor_user_id, 'pending' );
		$other_review_id = $this->insert_review_for_user( $this->other_user_id, 'pending' );
		wp_set_current_user( $this->editor_user_id );

		$list_request  = new WP_REST_Request( 'GET', '/mebuki-pm/v1/reviews/me' );
		$list_response = rest_do_request( $list_request );
		$this->assertSame( 200, $list_response->get_status() );
		$data = $list_response->get_data();
		$this->assertCount( 1, $data['reviews'] );
		$this->assertSame( $own_review_id, (int) $data['reviews'][0]['id'] );

		$patch_own = new WP_REST_Request( 'PATCH', '/mebuki-pm/v1/reviews/' . $own_review_id );
		$patch_own->set_header( 'Content-Type', 'application/json' );
		$patch_own->set_body( wp_json_encode( array( 'visibility' => 'public' ) ) );
		$patch_own_response = rest_do_request( $patch_own );
		$this->assertSame( 200, $patch_own_response->get_status() );

		$patch_other = new WP_REST_Request( 'PATCH', '/mebuki-pm/v1/reviews/' . $other_review_id );
		$patch_other->set_header( 'Content-Type', 'application/json' );
		$patch_other->set_body( wp_json_encode( array( 'visibility' => 'public' ) ) );
		$patch_other_response = rest_do_request( $patch_other );
		$this->assertSame( 404, $patch_other_response->get_status() );
	}
}


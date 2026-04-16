<?php
/**
 * Admin REST API tests for reviews list and visibility.
 */

class Test_API_Reviews_Admin extends WP_UnitTestCase {

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
	 * @return int Inserted review id.
	 */
	private function insert_review_for_admin( $status = 'pending' ) {
		global $wpdb;

		$table = $wpdb->prefix . 'mebuki_pm_reviews';
		$wpdb->insert(
			$table,
			array(
				'user_id'                => $this->admin_user_id,
				'item_type'              => 'service',
				'item_id'                => 'item-1',
				'reviewer_name'          => 'Test Reviewer',
				'reviewer_thumbnail_url' => '',
				'review_text'            => 'Nice work.',
				'status'                 => $status,
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		return (int) $wpdb->insert_id;
	}

	/**
	 * @return void
	 */
	public function test_admin_get_reviews_me_returns_rows() {
		$rid = $this->insert_review_for_admin( 'pending' );

		$request  = new WP_REST_Request( 'GET', '/mebuki-pm/v1/reviews/me' );
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'reviews', $data );
		$this->assertCount( 1, $data['reviews'] );
		$this->assertSame( $rid, (int) $data['reviews'][0]['id'] );
		$this->assertSame( 'pending', $data['reviews'][0]['status'] );
	}

	/**
	 * @return void
	 */
	public function test_admin_patch_review_visibility() {
		$rid = $this->insert_review_for_admin( 'pending' );

		$request = new WP_REST_Request( 'PATCH', '/mebuki-pm/v1/reviews/' . $rid );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'visibility' => 'public' ) ) );

		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['success'] );
		$this->assertSame( 'published', $data['review']['status'] );
	}
}

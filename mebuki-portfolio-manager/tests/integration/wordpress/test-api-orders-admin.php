<?php
/**
 * Admin REST API tests for orders list and status patch.
 */

class Test_API_Orders_Admin extends WP_UnitTestCase {

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
	 * @param string $status Order status.
	 * @return int Inserted order id.
	 */
	private function insert_order( $status = 'new' ) {
		global $wpdb;

		$table = $wpdb->prefix . 'mebuki_pm_orders';
		$uuid  = wp_generate_uuid4();
		$wpdb->insert(
			$table,
			array(
				'user_id'            => $this->admin_user_id,
				'uuid'               => $uuid,
				'client_name'        => '顧客テスト',
				'client_email'       => 'client@example.com',
				'status'             => $status,
				'total_amount'       => 12000,
				'order_details_json' => wp_json_encode( array( 'course' => 'Standard' ) ),
			),
			array( '%d', '%s', '%s', '%s', '%s', '%d', '%s' )
		);

		return (int) $wpdb->insert_id;
	}

	/**
	 * @return void
	 */
	public function test_admin_get_orders_me_returns_rows() {
		$oid = $this->insert_order( 'pending' );

		$request  = new WP_REST_Request( 'GET', '/mebuki-pm/v1/orders/me' );
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'orders', $data );
		$this->assertGreaterThanOrEqual( 1, count( $data['orders'] ) );
		$found = wp_list_filter( $data['orders'], array( 'id' => $oid ) );
		$this->assertCount( 1, $found );
		$item = reset( $found );
		$this->assertSame( 'pending', $item['status'] );
	}

	/**
	 * @return void
	 */
	public function test_admin_patch_order_status() {
		$oid = $this->insert_order( 'pending' );

		$request = new WP_REST_Request( 'PATCH', '/mebuki-pm/v1/orders/' . $oid );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'status' => 'completed' ) ) );

		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['success'] );
		$this->assertSame( 'completed', $data['order']['status'] );
	}
}

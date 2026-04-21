<?php
/**
 * Portfolio editor: REST media scoped to own uploads; cannot read others' attachments.
 */
class Test_API_Media_Portfolio_Editor extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private $editor_a_id;

	/**
	 * @var int
	 */
	private $editor_b_id;

	/**
	 * @var int
	 */
	private $admin_id;

	/**
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		$this->editor_a_id = self::factory()->user->create(
			array(
				'role'       => 'portfolio_editor',
				'user_login' => 'media_owner_a',
			)
		);
		$this->editor_b_id = self::factory()->user->create(
			array(
				'role'       => 'portfolio_editor',
				'user_login' => 'media_owner_b',
			)
		);
		$this->admin_id = self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'media_admin',
			)
		);
	}

	/**
	 * @return int Attachment post ID owned by given user.
	 */
	private function create_attachment_for_user( $user_id ) {
		return (int) self::factory()->attachment->create(
			array(
				'post_author' => (int) $user_id,
			)
		);
	}

	/**
	 * @return void
	 */
	public function test_portfolio_editor_cannot_get_other_users_attachment() {
		$other_attachment = $this->create_attachment_for_user( $this->editor_b_id );
		wp_set_current_user( $this->editor_a_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/media/' . $other_attachment );
		$response = rest_do_request( $request );
		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * @return void
	 */
	public function test_portfolio_editor_media_collection_excludes_others() {
		$own        = $this->create_attachment_for_user( $this->editor_a_id );
		$other_guy = $this->create_attachment_for_user( $this->editor_b_id );
		wp_set_current_user( $this->editor_a_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsArray( $data );
		$ids = wp_list_pluck( $data, 'id' );
		$this->assertContains( $own, $ids );
		$this->assertNotContains( $other_guy, $ids );
	}

	/**
	 * @return void
	 */
	public function test_administrator_can_get_any_attachment() {
		$other_attachment = $this->create_attachment_for_user( $this->editor_b_id );
		wp_set_current_user( $this->admin_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/media/' . $other_attachment );
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );
	}
}

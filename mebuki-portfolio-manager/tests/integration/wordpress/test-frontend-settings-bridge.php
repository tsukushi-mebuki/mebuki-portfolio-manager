<?php
/**
 * Frontend bridge tests between saved settings and localized source payload.
 */
class Test_Frontend_Settings_Bridge extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private $primary_admin_id;

	/**
	 * @var int
	 */
	private $secondary_admin_id;

	/**
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		Mebuki_PM_DB::migrate();

		$this->primary_admin_id = self::factory()->user->create(
			array(
				'role' => 'administrator',
			)
		);
		$this->secondary_admin_id = self::factory()->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	/**
	 * DB(option) value must be the same source consumed by frontend localize payload.
	 *
	 * @return void
	 */
	public function test_saved_option_is_used_as_frontend_settings_source() {
		$owner_method = new ReflectionMethod( 'Mebuki_PM_Frontend', 'get_portfolio_owner_context' );
		$owner_method->setAccessible( true );
		$owner_context     = $owner_method->invoke( null );
		$resolved_owner_id = isset( $owner_context['user_id'] ) ? (int) $owner_context['user_id'] : 0;

		update_option(
			'mebuki_pm_settings_' . $resolved_owner_id,
			array(
				'credo'              => array(
					'title' => '最優先オーナー設定',
					'body'  => 'フロントへ渡すべき内容',
				),
				'portfolio_site_url' => 'https://owner.example.com',
			),
			false
		);
		update_option(
			'mebuki_pm_settings_' . $this->primary_admin_id,
			array(
				'credo'              => array(
					'title' => '別オーナー設定',
					'body'  => 'この内容は採用されない想定',
				),
				'portfolio_site_url' => 'https://secondary.example.com',
			),
			false
		);

		$method = new ReflectionMethod( 'Mebuki_PM_Frontend', 'get_settings_for_localize' );
		$method->setAccessible( true );
		$settings = $method->invoke( null, $resolved_owner_id );

		$this->assertIsArray( $settings );
		$this->assertArrayHasKey( 'credo', $settings );
		$this->assertSame( '最優先オーナー設定', $settings['credo']['title'] );
		$this->assertSame( 'https://owner.example.com', $settings['portfolio_site_url'] );
	}

	/**
	 * Keep current behavior explicit: frontend owner is resolved to first administrator.
	 *
	 * @return void
	 */
	public function test_frontend_owner_resolution_uses_first_administrator() {
		$method = new ReflectionMethod( 'Mebuki_PM_Frontend', 'get_portfolio_owner_context' );
		$method->setAccessible( true );
		$owner_context = $method->invoke( null );
		$owner_id      = isset( $owner_context['user_id'] ) ? (int) $owner_context['user_id'] : 0;

		$this->assertGreaterThan( 0, $owner_id );
		$user = get_user_by( 'id', $owner_id );
		$this->assertInstanceOf( 'WP_User', $user );
		$this->assertContains( 'administrator', (array) $user->roles );
	}
}

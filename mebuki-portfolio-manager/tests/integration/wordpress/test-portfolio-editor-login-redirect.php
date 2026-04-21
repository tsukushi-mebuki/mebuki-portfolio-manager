<?php
/**
 * Login redirect targets for portfolio_editor role.
 */
class Test_Portfolio_Editor_Login_Redirect extends WP_UnitTestCase {
	/**
	 * @return void
	 */
	public function test_login_redirect_sends_portfolio_editor_to_frontend_dashboard() {
		$uid = self::factory()->user->create(
			array(
				'role'       => 'portfolio_editor',
				'user_login' => 'pe_dashboard',
			)
		);
		$user = new WP_User( $uid );

		$expected = Mebuki_PM_Frontend::get_dashboard_url_for_user( $uid );
		$actual     = apply_filters( 'login_redirect', admin_url(), '', $user );
		$this->assertSame( $expected, $actual );
	}

	/**
	 * @return void
	 */
	public function test_login_redirect_leaves_administrator_default_intact() {
		$uid = self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'site_admin',
			)
		);
		$user     = new WP_User( $uid );
		$fallback = admin_url( 'edit.php' );
		$actual   = apply_filters( 'login_redirect', $fallback, '', $user );
		$this->assertSame( $fallback, $actual );
	}

	/**
	 * @return void
	 */
	public function test_get_dashboard_url_for_invalid_user_falls_back_to_home() {
		$url = Mebuki_PM_Frontend::get_dashboard_url_for_user( 0 );
		$this->assertSame( home_url( '/' ), $url );
	}
}

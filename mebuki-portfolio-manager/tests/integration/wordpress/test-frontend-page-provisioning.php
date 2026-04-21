<?php
/**
 * Activation provisioning for frontend fixed pages and routes.
 */
class Test_Frontend_Page_Provisioning extends WP_UnitTestCase {
	private const OPTION_PAGE_PORTFOLIO = 'mebuki_pm_page_portfolio_id';
	private const OPTION_PAGE_DASHBOARD = 'mebuki_pm_page_dashboard_id';
	private const OPTION_PAGE_REVIEWS   = 'mebuki_pm_page_reviews_id';

	/**
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		$this->set_permalink_structure( '/%postname%/' );
		$this->delete_page_if_exists( Mebuki_PM_Frontend::PAGE_SLUG_PORTFOLIO );
		$this->delete_page_if_exists( Mebuki_PM_Frontend::PAGE_SLUG_DASHBOARD );
		$this->delete_page_if_exists( Mebuki_PM_Frontend::PAGE_SLUG_REVIEWS );
		delete_option( self::OPTION_PAGE_PORTFOLIO );
		delete_option( self::OPTION_PAGE_DASHBOARD );
		delete_option( self::OPTION_PAGE_REVIEWS );
		flush_rewrite_rules();
	}

	/**
	 * @return void
	 */
	public function tear_down() {
		$this->delete_page_if_exists( Mebuki_PM_Frontend::PAGE_SLUG_PORTFOLIO );
		$this->delete_page_if_exists( Mebuki_PM_Frontend::PAGE_SLUG_DASHBOARD );
		$this->delete_page_if_exists( Mebuki_PM_Frontend::PAGE_SLUG_REVIEWS );
		delete_option( self::OPTION_PAGE_PORTFOLIO );
		delete_option( self::OPTION_PAGE_DASHBOARD );
		delete_option( self::OPTION_PAGE_REVIEWS );
		parent::tear_down();
	}

	/**
	 * @param string $slug Page slug.
	 * @return void
	 */
	private function delete_page_if_exists( $slug ) {
		$page = get_page_by_path( $slug, OBJECT, 'page' );
		if ( $page instanceof WP_Post ) {
			wp_delete_post( $page->ID, true );
		}
	}

	/**
	 * @return void
	 */
	public function test_activate_creates_three_pages_and_stores_options() {
		Mebuki_Portfolio_Manager::activate();

		$portfolio = get_page_by_path( Mebuki_PM_Frontend::PAGE_SLUG_PORTFOLIO, OBJECT, 'page' );
		$dashboard = get_page_by_path( Mebuki_PM_Frontend::PAGE_SLUG_DASHBOARD, OBJECT, 'page' );
		$reviews   = get_page_by_path( Mebuki_PM_Frontend::PAGE_SLUG_REVIEWS, OBJECT, 'page' );

		$this->assertInstanceOf( 'WP_Post', $portfolio );
		$this->assertInstanceOf( 'WP_Post', $dashboard );
		$this->assertInstanceOf( 'WP_Post', $reviews );
		$this->assertSame( 'publish', $portfolio->post_status );
		$this->assertSame( '[mebuki-portfolio]', trim( $portfolio->post_content ) );
		$this->assertSame( '[mebuki-portfolio]', trim( $dashboard->post_content ) );
		$this->assertSame( '[mebuki-portfolio]', trim( $reviews->post_content ) );

		$this->assertSame( (int) $portfolio->ID, (int) get_option( self::OPTION_PAGE_PORTFOLIO ) );
		$this->assertSame( (int) $dashboard->ID, (int) get_option( self::OPTION_PAGE_DASHBOARD ) );
		$this->assertSame( (int) $reviews->ID, (int) get_option( self::OPTION_PAGE_REVIEWS ) );
	}

	/**
	 * @return void
	 */
	public function test_activate_is_idempotent_and_does_not_duplicate_pages() {
		Mebuki_Portfolio_Manager::activate();
		Mebuki_Portfolio_Manager::activate();

		$portfolio_pages = get_posts(
			array(
				'post_type'      => 'page',
				'name'           => Mebuki_PM_Frontend::PAGE_SLUG_PORTFOLIO,
				'posts_per_page' => 10,
				'post_status'    => 'any',
			)
		);
		$dashboard_pages = get_posts(
			array(
				'post_type'      => 'page',
				'name'           => Mebuki_PM_Frontend::PAGE_SLUG_DASHBOARD,
				'posts_per_page' => 10,
				'post_status'    => 'any',
			)
		);
		$review_pages = get_posts(
			array(
				'post_type'      => 'page',
				'name'           => Mebuki_PM_Frontend::PAGE_SLUG_REVIEWS,
				'posts_per_page' => 10,
				'post_status'    => 'any',
			)
		);

		$this->assertCount( 1, $portfolio_pages );
		$this->assertCount( 1, $dashboard_pages );
		$this->assertCount( 1, $review_pages );
	}

	/**
	 * @return void
	 */
	public function test_routes_resolve_to_expected_pages_and_modes() {
		Mebuki_Portfolio_Manager::activate();
		$user_id = self::factory()->user->create(
			array(
				'user_login' => 'user_for_route_test',
			)
		);
		$user = get_user_by( 'id', $user_id );
		$slug = $user instanceof WP_User ? (string) $user->user_nicename : '';

		$this->go_to( home_url( '/portfolio/' . $slug . '/' ) );
		$this->assertSame( Mebuki_PM_Frontend::PAGE_SLUG_PORTFOLIO, get_query_var( 'pagename' ) );
		$this->assertSame( $slug, get_query_var( Mebuki_PM_Frontend::QUERY_VAR_USER ) );
		$this->assertSame( '', get_query_var( Mebuki_PM_Frontend::QUERY_VAR_MODE ) );

		$this->go_to( home_url( '/portfolio/' . $slug . '/dashboard/' ) );
		$this->assertSame( Mebuki_PM_Frontend::PAGE_SLUG_DASHBOARD, get_query_var( 'pagename' ) );
		$this->assertSame( $slug, get_query_var( Mebuki_PM_Frontend::QUERY_VAR_USER ) );
		$this->assertSame( Mebuki_PM_Frontend::MODE_DASHBOARD, get_query_var( Mebuki_PM_Frontend::QUERY_VAR_MODE ) );

		$this->go_to( home_url( '/portfolio/' . $slug . '/reviews/' ) );
		$this->assertSame( Mebuki_PM_Frontend::PAGE_SLUG_REVIEWS, get_query_var( 'pagename' ) );
		$this->assertSame( $slug, get_query_var( Mebuki_PM_Frontend::QUERY_VAR_USER ) );
		$this->assertSame( Mebuki_PM_Frontend::MODE_REVIEWS, get_query_var( Mebuki_PM_Frontend::QUERY_VAR_MODE ) );
	}

	/**
	 * @return void
	 */
	public function test_dashboard_access_is_denied_for_other_users() {
		Mebuki_Portfolio_Manager::activate();

		$owner_id = self::factory()->user->create(
			array(
				'user_login' => 'owner_for_dashboard',
			)
		);
		$other_id = self::factory()->user->create(
			array(
				'user_login' => 'other_for_dashboard',
			)
		);
		$owner = get_user_by( 'id', $owner_id );
		$slug  = $owner instanceof WP_User ? (string) $owner->user_nicename : '';

		wp_set_current_user( $other_id );
		$this->go_to( home_url( '/portfolio/' . $slug . '/dashboard/' ) );
		$this->assertSame( Mebuki_PM_Frontend::MODE_DASHBOARD, get_query_var( Mebuki_PM_Frontend::QUERY_VAR_MODE ) );

		$method = new ReflectionMethod( 'Mebuki_PM_Frontend', 'can_manage_portfolio' );
		$method->setAccessible( true );
		$this->assertFalse( (bool) $method->invoke( null, $owner_id ) );

		wp_set_current_user( $owner_id );
		$this->assertTrue( (bool) $method->invoke( null, $owner_id ) );
	}
}


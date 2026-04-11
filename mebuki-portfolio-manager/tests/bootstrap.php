<?php
/**
 * PHPUnit bootstrap for WordPress plugin tests.
 */

$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = '/tmp/wordpress-tests-lib';
}

if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	$local_tests_dir = dirname( __DIR__ ) . '/.wp-tests-lib';
	if ( file_exists( $local_tests_dir . '/includes/functions.php' ) ) {
		$_tests_dir = $local_tests_dir;
	}
}

/**
 * Manually load the plugin under test.
 *
 * @return void
 */
function mebuki_pm_manually_load_plugin() {
	require dirname( __DIR__ ) . '/mebuki-portfolio-manager.php';
}

require_once $_tests_dir . '/includes/functions.php';
tests_add_filter( 'muplugins_loaded', 'mebuki_pm_manually_load_plugin' );

require $_tests_dir . '/includes/bootstrap.php';

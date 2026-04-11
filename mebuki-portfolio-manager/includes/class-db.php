<?php

defined( 'ABSPATH' ) || exit;

/**
 * Database migration handler.
 */
class Mebuki_PM_DB {

	/**
	 * Create or update plugin tables.
	 *
	 * @return void
	 */
	public static function migrate() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset_collate = $wpdb->get_charset_collate();
		$settings_table  = $wpdb->prefix . 'mebuki_pm_settings';
		$orders_table    = $wpdb->prefix . 'mebuki_pm_orders';
		$reviews_table   = $wpdb->prefix . 'mebuki_pm_reviews';

		$sql_settings = "CREATE TABLE {$settings_table} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT(20) UNSIGNED NOT NULL,
			setting_json JSON NOT NULL,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			KEY user_id (user_id)
		) {$charset_collate};";

		$sql_orders = "CREATE TABLE {$orders_table} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT(20) UNSIGNED NOT NULL,
			uuid CHAR(36) NOT NULL,
			client_name VARCHAR(255) NOT NULL,
			client_email VARCHAR(255) NOT NULL,
			status VARCHAR(50) NOT NULL,
			total_amount INT UNSIGNED NOT NULL,
			order_details_json JSON NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY uuid (uuid),
			KEY user_id (user_id),
			KEY status (status)
		) {$charset_collate};";

		$sql_reviews = "CREATE TABLE {$reviews_table} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT(20) UNSIGNED NOT NULL,
			item_type VARCHAR(50) NOT NULL,
			item_id VARCHAR(255) NOT NULL,
			reviewer_name VARCHAR(255) NOT NULL,
			reviewer_thumbnail_url VARCHAR(500) DEFAULT '' NOT NULL,
			review_text TEXT NOT NULL,
			status VARCHAR(20) NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			KEY user_id (user_id),
			KEY status (status),
			KEY target_item (item_type, item_id)
		) {$charset_collate};";

		dbDelta( $sql_settings );
		dbDelta( $sql_orders );
		dbDelta( $sql_reviews );
	}
}


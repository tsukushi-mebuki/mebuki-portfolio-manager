<?php
/**
 * mod_php ではコンテナの WORDPRESS_* が getenv() に見えないことがある。
 * wp-config-docker.php の getenv_docker() より前に実行し、未設定時だけ putenv する。
 * 値は docker-compose の wordpress.environment と一致させること。
 */
$mebuki_defaults = array(
	'WORDPRESS_DB_HOST'     => 'db:3306',
	'WORDPRESS_DB_NAME'     => 'wordpress',
	'WORDPRESS_DB_USER'     => 'wordpress',
	'WORDPRESS_DB_PASSWORD' => 'wordpress',
);
foreach ( $mebuki_defaults as $key => $value ) {
	if ( getenv( $key ) === false ) {
		putenv( $key . '=' . $value );
	}
}

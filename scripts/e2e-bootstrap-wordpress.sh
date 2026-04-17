#!/usr/bin/env bash
# E2E 用: Docker の db / wordpress が使えるまで待ち、setup-wp-e2e.php で WP をインストール・検証する。
# リポジトリルートで:  bash scripts/e2e-bootstrap-wordpress.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker compose ps 2>/dev/null || true

SETUP_IN_CONTAINER="/var/www/html/wp-content/plugins/mebuki-portfolio-manager/scripts/setup-wp-e2e.php"
E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:8000}"

echo "==> Waiting for MySQL (db)..."
for i in $(seq 1 60); do
	if docker compose exec -T db mysqladmin ping -h localhost -uroot -proot_password --silent 2>/dev/null; then
		echo "MySQL is ready."
		break
	fi
	if [ "$i" -eq 60 ]; then
		echo "MySQL did not become ready in time." >&2
		exit 1
	fi
	sleep 2
done

echo "==> Waiting for WordPress HTTP (${E2E_BASE_URL})..."
for i in $(seq 1 60); do
	if curl -fsS "${E2E_BASE_URL}" >/dev/null 2>&1; then
		echo "WordPress HTTP is up."
		break
	fi
	if [ "$i" -eq 60 ]; then
		echo "WordPress HTTP did not become ready in time." >&2
		exit 1
	fi
	sleep 2
done

echo "==> Waiting for MySQL reachable from wordpress container (same path as wp-load)..."
for i in $(seq 1 60); do
	if docker compose exec -T wordpress php -r '
		mysqli_report(MYSQLI_REPORT_OFF);
		$h = getenv("WORDPRESS_DB_HOST") ?: "db:3306";
		if (strpos($h, ":") !== false) {
			list($host, $port) = explode(":", $h, 2);
		} else {
			$host = $h;
			$port = "3306";
		}
		$m = @new mysqli($host, getenv("WORDPRESS_DB_USER") ?: "wordpress", getenv("WORDPRESS_DB_PASSWORD") ?: "wordpress", getenv("WORDPRESS_DB_NAME") ?: "wordpress", (int) $port);
		exit(($m && !$m->connect_error) ? 0 : 1);
	' 2>/dev/null; then
		echo "WordPress container can connect to MySQL."
		break
	fi
	if [ "$i" -eq 60 ]; then
		echo "WordPress container could not connect to MySQL in time." >&2
		exit 1
	fi
	sleep 2
done

verify_wp_http_installed() {
	local final path
	# 未インストール時は wp-login が install.php へ飛ぶ。
	# 全文 grep だと ?redirect_to=...%2Fwp-admin%2Finstall.php ... のクエリに誤マッチするため、パスのみ見る。
	final="$(curl -fsSL -o /dev/null -w '%{url_effective}' "${E2E_BASE_URL}/wp-login.php")" || return 1
	if [[ "$final" =~ ^https?://[^/]+(/[^?#]*) ]]; then
		path="${BASH_REMATCH[1]}"
	else
		path=""
	fi
	case "$path" in
		/wp-admin/install.php|*/wp-admin/install.php)
			echo "verify_wp_http_installed: on installer path path=${path} url=${final}" >&2
			return 1
			;;
		/wp-admin/setup-config.php|*/wp-admin/setup-config.php)
			echo "verify_wp_http_installed: on setup-config path=${path} url=${final}" >&2
			return 1
			;;
		*) return 0 ;;
	esac
}

# wp-load 時に HTTP_HOST が無いと警告・挙動がずれるため、setup-wp-e2e.php と同様に CLI 用 $_SERVER を付与する
verify_wp_cli_installed() {
	docker compose exec -T \
		-e E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:8000}" \
		wordpress php <<'EOPHP'
<?php
$site_url = getenv( 'E2E_BASE_URL' ) ?: 'http://localhost:8000';
$parsed   = parse_url( $site_url );
if ( is_array( $parsed ) && ! empty( $parsed['host'] ) ) {
	$host = $parsed['host'];
	if ( ! empty( $parsed['port'] ) ) {
		$host .= ':' . $parsed['port'];
	}
	$_SERVER['HTTP_HOST']   = $host;
	$_SERVER['HTTPS']       = ( isset( $parsed['scheme'] ) && 'https' === $parsed['scheme'] ) ? 'on' : 'off';
	$_SERVER['SERVER_NAME'] = $parsed['host'];
	$_SERVER['REQUEST_URI'] = '/';
	if ( ! empty( $parsed['port'] ) ) {
		$_SERVER['SERVER_PORT'] = (string) (int) $parsed['port'];
	} else {
		$_SERVER['SERVER_PORT'] = ( isset( $parsed['scheme'] ) && 'https' === $parsed['scheme'] ) ? '443' : '80';
	}
}
require '/var/www/html/wp-load.php';
exit( is_blog_installed() ? 0 : 1 );
EOPHP
}

echo "==> Running setup-wp-e2e.php (with retries for CI DB / entrypoint races)..."
for attempt in $(seq 1 5); do
	setup_rc=0
	docker compose exec -T \
		-e E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:8000}" \
		-e E2E_ADMIN_USER="${E2E_ADMIN_USER:-admin}" \
		-e E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-password}" \
		wordpress php "$SETUP_IN_CONTAINER" || setup_rc=$?

	if [ "$setup_rc" -ne 0 ]; then
		echo "WARN: setup-wp-e2e.php exited with ${setup_rc} (attempt ${attempt})." >&2
	elif verify_wp_cli_installed; then
		if verify_wp_http_installed; then
			echo "WordPress install verified (CLI + HTTP, attempt ${attempt})."
			break
		fi
		echo "WARN: is_blog_installed is true but HTTP still looks like the installer; retrying..." >&2
	else
		echo "WARN: is_blog_installed check failed after setup (attempt ${attempt})." >&2
	fi

	if [ "$attempt" -eq 5 ]; then
		echo "WordPress bootstrap failed after 5 attempts." >&2
		exit 1
	fi
	sleep 5
done

echo "==> E2E WordPress bootstrap complete (page + shortcode checks are in setup-wp-e2e.php)."

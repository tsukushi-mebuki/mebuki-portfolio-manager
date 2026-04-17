#!/usr/bin/env bash
# E2E 用: Docker の db / wordpress が使えるまで待ち、setup-wp-e2e.php で WP をインストール・検証する。
# リポジトリルートで:  bash scripts/e2e-bootstrap-wordpress.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Git Bash (MSYS) on Windows may rewrite /var/... arguments passed to docker.exe.
# Disable path conversion so container absolute paths stay intact.
if [ -n "${MSYSTEM:-}" ]; then
	export MSYS_NO_PATHCONV=1
	export MSYS2_ARG_CONV_EXCL='*'
fi

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

is_installer_path() {
	local url path
	url="$1"
	if [[ "$url" =~ ^https?://[^/]+(/[^?#]*) ]]; then
		path="${BASH_REMATCH[1]}"
	else
		path=""
	fi
	case "$path" in
		/wp-admin/install.php|*/wp-admin/install.php|/wp-admin/setup-config.php|*/wp-admin/setup-config.php) return 0 ;;
		*) return 1 ;;
	esac
}

verify_wp_http_installed() {
	local final_root final_admin final_login
	local status_root status_admin status_login
	local tmp_root tmp_admin tmp_login

	# wp-login 単体だと一時的・環境依存のリダイレクトで誤判定しやすいため、
	# ルートと wp-admin も合わせて判定する。
	tmp_root="$(mktemp)"
	tmp_admin="$(mktemp)"
	tmp_login="$(mktemp)"
	trap 'rm -f "$tmp_root" "$tmp_admin" "$tmp_login"' RETURN

	final_root="$(curl -fsSL -o "$tmp_root" -w '%{url_effective}' "${E2E_BASE_URL}/")" || return 1
	final_admin="$(curl -fsSL -o "$tmp_admin" -w '%{url_effective}' "${E2E_BASE_URL}/wp-admin/")" || return 1
	final_login="$(curl -fsSL -o "$tmp_login" -w '%{url_effective}' "${E2E_BASE_URL}/wp-login.php")" || return 1
	status_root="$(curl -fsSL -o "$tmp_root" -w '%{http_code}' "${E2E_BASE_URL}/")" || status_root="(curl-failed)"
	status_admin="$(curl -fsSL -o "$tmp_admin" -w '%{http_code}' "${E2E_BASE_URL}/wp-admin/")" || status_admin="(curl-failed)"
	status_login="$(curl -fsSL -o "$tmp_login" -w '%{http_code}' "${E2E_BASE_URL}/wp-login.php")" || status_login="(curl-failed)"

	echo "verify_wp_http_installed: root=${final_root} status=${status_root}; admin=${final_admin} status=${status_admin}; login=${final_login} status=${status_login}" >&2

	if is_installer_path "$final_root" && is_installer_path "$final_admin" && is_installer_path "$final_login"; then
		echo "verify_wp_http_installed: installer-like redirects root=${final_root} admin=${final_admin} login=${final_login}" >&2
		return 1
	fi
	return 0
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

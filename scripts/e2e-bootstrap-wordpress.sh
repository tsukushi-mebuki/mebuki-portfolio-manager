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
	local final
	# 未インストール時は wp-login が install.php（言語選択）へ飛ぶため、ここで検知する
	final="$(curl -fsSL -o /dev/null -w '%{url_effective}' "${E2E_BASE_URL}/wp-login.php")" || return 1
	case "$final" in
		*install.php*|*setup-config.php*) return 1 ;;
		*) return 0 ;;
	esac
}

echo "==> Running setup-wp-e2e.php (with retries for CI DB / entrypoint races)..."
for attempt in $(seq 1 5); do
	setup_rc=0
	docker compose exec -T \
		-e E2E_ADMIN_USER="${E2E_ADMIN_USER:-admin}" \
		-e E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-password}" \
		wordpress php "$SETUP_IN_CONTAINER" || setup_rc=$?

	if [ "$setup_rc" -ne 0 ]; then
		echo "WARN: setup-wp-e2e.php exited with ${setup_rc} (attempt ${attempt})." >&2
	elif docker compose exec -T wordpress php -r "require '/var/www/html/wp-load.php'; exit(is_blog_installed() ? 0 : 1);"; then
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

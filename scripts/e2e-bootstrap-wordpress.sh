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

echo "==> Running setup-wp-e2e.php..."
docker compose exec -T \
	-e E2E_ADMIN_USER="${E2E_ADMIN_USER:-admin}" \
	-e E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-password}" \
	wordpress php "$SETUP_IN_CONTAINER"

echo "==> Verifying WordPress is installed..."
docker compose exec -T wordpress php -r "require '/var/www/html/wp-load.php'; exit(is_blog_installed() ? 0 : 1);"

echo "==> E2E WordPress bootstrap complete (page + shortcode checks are in setup-wp-e2e.php)."

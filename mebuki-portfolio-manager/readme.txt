=== Mebuki Portfolio Manager ===
Contributors: mebuki-works
Tags: portfolio, orders, reviews, stripe, rest-api
Requires at least: 6.0
Tested up to: 6.6
Requires PHP: 8.0
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

WordPress plugin for portfolio settings, inquiry/order workflows, reviews, and Stripe checkout integration.
ポートフォリオ設定、受注管理、レビュー管理、Stripe Checkout 連携を提供する WordPress プラグインです。

== Description ==

EN:
Mebuki Portfolio Manager provides a React-based admin screen and frontend portfolio rendering via shortcode.  
It includes custom database tables and REST endpoints for settings, orders, reviews, and Stripe webhook handling.

JA:
Mebuki Portfolio Manager は、Reactベースの管理UIとショートコードによるフロント表示を提供します。  
設定・受注・レビュー・Stripe Webhook に対応した専用テーブルと REST API を含みます。

== Features ==

EN:
* Admin menu: `Mebuki PM`
* Shortcode: `[mebuki_portfolio]`
* Custom tables on activation:
  * `{wp_prefix}mebuki_pm_settings`
  * `{wp_prefix}mebuki_pm_orders`
  * `{wp_prefix}mebuki_pm_reviews`
* REST namespace: `mebuki-pm/v1`
* Stripe checkout + webhook support

JA:
* 管理メニュー `Mebuki PM` を追加
* ショートコード `[mebuki_portfolio]` を提供
* 有効化時に専用テーブルを作成
  * `{wp_prefix}mebuki_pm_settings`
  * `{wp_prefix}mebuki_pm_orders`
  * `{wp_prefix}mebuki_pm_reviews`
* REST 名前空間 `mebuki-pm/v1`
* Stripe Checkout / Webhook に対応

== Installation ==

EN:
1. Place this plugin directory under `wp-content/plugins/`.
2. Install dependencies in plugin directory:
   `composer install`
3. Activate **Mebuki Portfolio Manager** from WordPress admin.
4. Create a page and add `[mebuki_portfolio]`.
5. Open `WP Admin > Mebuki PM` and configure settings.

JA:
1. このプラグインを `wp-content/plugins/` 配下に配置します。
2. プラグインディレクトリで依存関係をインストールします:
   `composer install`
3. WordPress 管理画面で **Mebuki Portfolio Manager** を有効化します。
4. 固定ページを作成し `[mebuki_portfolio]` を追加します。
5. `WP Admin > Mebuki PM` から設定を行います。

== Shortcode Usage ==

EN:
* To render the portfolio frontend, place `[mebuki_portfolio]` in page content.
* No specific page slug is required in production.
* E2E scripts expect a page with slug `portfolio-e2e` (test-only convention).

JA:
* ポートフォリオ表示は、固定ページ本文に `[mebuki_portfolio]` を記入すると出力されます。
* 本番運用では固定ページのスラッグ指定は必須ではありません。
* ただし E2E スクリプトでは `portfolio-e2e` スラッグを前提にしています（テスト用途のみ）。

== Frequently Used REST Endpoints ==

EN:
* `GET/POST /settings` (admin)
* `GET/POST /settings/me` (admin)
* `POST /orders` (public)
* `POST /orders/checkout` (public)
* `GET /orders/me` (admin)
* `PATCH /orders/{id}` (admin)
* `POST /reviews` (public)
* `GET /reviews/me` (admin)
* `GET /reviews/published?user_id={id}` (public)
* `PATCH /reviews/{id}` (admin)
* `POST /webhooks/stripe` (public)

JA:
* `GET/POST /settings`（管理者）
* `GET/POST /settings/me`（管理者）
* `POST /orders`（公開）
* `POST /orders/checkout`（公開）
* `GET /orders/me`（管理者）
* `PATCH /orders/{id}`（管理者）
* `POST /reviews`（公開）
* `GET /reviews/me`（管理者）
* `GET /reviews/published?user_id={id}`（公開）
* `PATCH /reviews/{id}`（管理者）
* `POST /webhooks/stripe`（公開）

== Stripe ==

EN:
* Requires `stripe/stripe-php` (installed by Composer).
* `orders/checkout` requires Stripe Secret Key in plugin settings.
* Webhook endpoint verifies signature via configured webhook secret.

JA:
* `stripe/stripe-php` が必要です（Composerで導入）。
* `orders/checkout` には設定内の Stripe Secret Key が必要です。
* Webhook は保存済みの Webhook Secret で署名検証します。

== Development ==

EN:
Run tests in plugin directory:
`composer test`
If Composer is not installed on host, run via Docker:
`docker compose up -d`
`docker compose exec db mysql -uroot -proot_password -e "CREATE DATABASE IF NOT EXISTS wordpress_test;"`
`docker compose run --rm composer "composer install --no-interaction --prefer-dist"`
`docker compose run --rm composer "curl -sSLo /tmp/install-wp-tests.sh https://raw.githubusercontent.com/wp-cli/scaffold-command/master/templates/install-wp-tests.sh && chmod +x /tmp/install-wp-tests.sh && /tmp/install-wp-tests.sh wordpress_test root root_password db latest true"`
`docker compose exec wordpress sh -lc "cd /var/www/html/wp-content/plugins/mebuki-portfolio-manager && WP_TESTS_DIR=/tmp/wordpress-tests-lib WP_TESTS_DB_HOST=db WP_TESTS_DB_NAME=wordpress_test WP_TESTS_DB_USER=root WP_TESTS_DB_PASSWORD=root_password vendor/bin/phpunit -c phpunit.xml.dist"`

JA:
プラグインディレクトリでテスト実行:
`composer test`
Composer がホストにない場合は Docker 経由で実行:
`docker compose up -d`
`docker compose exec db mysql -uroot -proot_password -e "CREATE DATABASE IF NOT EXISTS wordpress_test;"`
`docker compose run --rm composer "composer install --no-interaction --prefer-dist"`
`docker compose run --rm composer "curl -sSLo /tmp/install-wp-tests.sh https://raw.githubusercontent.com/wp-cli/scaffold-command/master/templates/install-wp-tests.sh && chmod +x /tmp/install-wp-tests.sh && /tmp/install-wp-tests.sh wordpress_test root root_password db latest true"`
`docker compose exec wordpress sh -lc "cd /var/www/html/wp-content/plugins/mebuki-portfolio-manager && WP_TESTS_DIR=/tmp/wordpress-tests-lib WP_TESTS_DB_HOST=db WP_TESTS_DB_NAME=wordpress_test WP_TESTS_DB_USER=root WP_TESTS_DB_PASSWORD=root_password vendor/bin/phpunit -c phpunit.xml.dist"`

== Changelog ==

= 0.1.0 =
* Initial release.

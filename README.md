# Mebuki Portfolio Manager (Docker Project) / Dockerプロジェクト

Local development environment and plugin source for **Mebuki Portfolio Manager**.

**Mebuki Portfolio Manager** のローカル開発環境（Docker）とプラグイン本体をまとめたリポジトリです。

## Repository Structure / ディレクトリ構成

- `docker-compose.yml`: Local WordPress + MySQL + phpMyAdmin setup.
- `mebuki-portfolio-manager/`: WordPress plugin source code.
- `mebuki-portfolio-manager/readme.txt`: Plugin documentation for WordPress-style distribution.

- `docker-compose.yml`: WordPress + MySQL + phpMyAdmin のローカル環境定義。
- `mebuki-portfolio-manager/`: WordPressプラグイン本体。
- `mebuki-portfolio-manager/readme.txt`: WordPress配布形式を意識したプラグイン説明。

## Quick Start / クイックスタート

1. Start containers.
   - `docker compose up -d`
2. Open WordPress install screen.
   - `http://localhost:8000`
3. Complete site setup and login to admin.
4. Activate **Mebuki Portfolio Manager** in Plugins menu.
5. Add shortcode to a page:
   - `[mebuki_portfolio]`

1. コンテナを起動します。
   - `docker compose up -d`
2. WordPress初期設定画面を開きます。
   - `http://localhost:8000`
3. サイト初期設定を完了し、管理画面へログインします。
4. プラグイン一覧で **Mebuki Portfolio Manager** を有効化します。
5. 固定ページにショートコードを追加します。
   - `[mebuki_portfolio]`

## Service Ports / ポート

- WordPress: `http://localhost:8000`
- phpMyAdmin: `http://localhost:8080`

## Development Notes / 開発メモ

- Plugin code is mounted into the WordPress container from `./mebuki-portfolio-manager`.
- If plugin updates are not reflected, restart WordPress container:
  - `docker compose restart wordpress`
- Public REST endpoints for portfolio actions are slug-based (`user_slug`) and no longer accept `user_id` as public owner input.

- プラグインコードは `./mebuki-portfolio-manager` から WordPress コンテナへマウントされます。
- 変更が反映されない場合は WordPress コンテナを再起動してください:
  - `docker compose restart wordpress`
- 公開REST APIのオーナー解決は `user_slug` 固定で、公開入力としての `user_id` は受け付けません。

## Testing / テスト

- PHP tests are managed with PHPUnit (`tests/`).
- CI runs automatically on push and pull request via GitHub Actions (`.github/workflows/test.yml`).
- For local execution using Docker:
  - (first run) `docker compose up -d`
  - (if DB volume already exists) `docker compose exec db mysql -uroot -proot_password -e "CREATE DATABASE IF NOT EXISTS wordpress_test;"`
  - `docker compose run --rm composer "composer install --no-interaction --prefer-dist"`
  - `docker compose run --rm composer "curl -sSLo /tmp/install-wp-tests.sh https://raw.githubusercontent.com/wp-cli/scaffold-command/master/templates/install-wp-tests.sh && chmod +x /tmp/install-wp-tests.sh && /tmp/install-wp-tests.sh wordpress_test root root_password db latest true"`
  - `docker compose exec wordpress sh -lc "cd /var/www/html/wp-content/plugins/mebuki-portfolio-manager && WP_TESTS_DIR=/tmp/wordpress-tests-lib WP_TESTS_DB_HOST=db WP_TESTS_DB_NAME=wordpress_test WP_TESTS_DB_USER=root WP_TESTS_DB_PASSWORD=root_password vendor/bin/phpunit -c phpunit.xml.dist"`

- PHPテストは PHPUnit（`tests/`）で管理しています。
- CI は GitHub Actions（`.github/workflows/test.yml`）で push / pull request 時に自動実行されます。
- ローカルで Docker 実行する場合:
  - （初回）`docker compose up -d`
  - （既存DBボリューム利用時）`docker compose exec db mysql -uroot -proot_password -e "CREATE DATABASE IF NOT EXISTS wordpress_test;"`
  - `docker compose run --rm composer "composer install --no-interaction --prefer-dist"`
  - `docker compose run --rm composer "curl -sSLo /tmp/install-wp-tests.sh https://raw.githubusercontent.com/wp-cli/scaffold-command/master/templates/install-wp-tests.sh && chmod +x /tmp/install-wp-tests.sh && /tmp/install-wp-tests.sh wordpress_test root root_password db latest true"`
  - `docker compose exec wordpress sh -lc "cd /var/www/html/wp-content/plugins/mebuki-portfolio-manager && WP_TESTS_DIR=/tmp/wordpress-tests-lib WP_TESTS_DB_HOST=db WP_TESTS_DB_NAME=wordpress_test WP_TESTS_DB_USER=root WP_TESTS_DB_PASSWORD=root_password vendor/bin/phpunit -c phpunit.xml.dist"`

## Plugin Details / プラグイン詳細

See `mebuki-portfolio-manager/readme.txt` for plugin features, REST endpoints, Stripe notes, and test commands.

プラグイン機能、REST API、Stripe連携、テスト手順は `mebuki-portfolio-manager/readme.txt` を参照してください。
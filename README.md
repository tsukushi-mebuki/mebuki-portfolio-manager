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

- プラグインコードは `./mebuki-portfolio-manager` から WordPress コンテナへマウントされます。
- 変更が反映されない場合は WordPress コンテナを再起動してください:
  - `docker compose restart wordpress`

## Plugin Details / プラグイン詳細

See `mebuki-portfolio-manager/readme.txt` for plugin features, REST endpoints, Stripe notes, and test commands.

プラグイン機能、REST API、Stripe連携、テスト手順は `mebuki-portfolio-manager/readme.txt` を参照してください。
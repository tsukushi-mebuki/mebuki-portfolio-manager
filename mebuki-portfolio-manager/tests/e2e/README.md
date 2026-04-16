# e2e

ユーザー体験のシナリオテスト（管理画面保存 -> 公開反映など）を配置します。

## 目的

- 管理画面で入力した値が公開ポートフォリオへ反映される回帰を検知する
- API単体テストだけでは検知しづらい「画面間の断線」を早期に発見する

## セットアップ

`tests/e2e` で依存関係をインストールします。

```bash
cd tests/e2e
npm install
npx playwright install chromium
```

## 実行

必要な環境変数を設定してから実行します。

```bash
cd tests/e2e
$env:E2E_BASE_URL="http://localhost:8000"
$env:E2E_ADMIN_USER="admin"
$env:E2E_ADMIN_PASSWORD="your-password"
$env:E2E_FRONTEND_PATH="/portfolio"
npm run test:e2e
```

任意の環境変数:

- `E2E_ADMIN_PATH`（既定: `/wp-admin/admin.php?page=mebuki-pm`）
- `E2E_FRONTEND_PATH`（既定: `/`）

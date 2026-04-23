# Mebuki Portfolio Manager 設計スナップショット

更新日: 2026-04-21  
対象: 現在実装済みのテーブル設計 / `settings` JSON設計 / セクション別テーマ拡張

## 1. DBテーブル一覧

### `wp_mebuki_pm_settings`
- 用途: ポートフォリオオーナーごとの設定JSON保存
- 主なカラム
  - `id` (PK)
  - `user_id` (所有者)
  - `setting_json` (設定本体)
  - `updated_at`
- 備考: `setting_json` をREST APIで読み書きし、フロント/管理画面の表示を構成

### `wp_mebuki_pm_orders`
- 用途: 問い合わせ・見積もり・決済ワークフロー管理
- 主なカラム
  - `id` (PK)
  - `user_id` (受注側オーナー)
  - `uuid` (冪等キー)
  - `client_name`, `client_email`
  - `status` (`new`, `payment_pending`, `pending`, `in_progress`, `completed` など)
  - `total_amount`
  - `order_details_json`
  - `created_at`, `updated_at`

### `wp_mebuki_pm_reviews`
- 用途: 口コミ投稿・公開制御
- 主なカラム
  - `id` (PK)
  - `user_id` (対象ポートフォリオ所有者)
  - `item_type`, `item_id`
  - `reviewer_name`, `reviewer_thumbnail_url`, `review_text`
  - `status` (`pending`, `published`, `private`)
  - `created_at`, `updated_at`

## 2. `settings` JSON 主要キー

## グローバル設定
- `layout_order: SectionId[]`
- `theme_preset: 'white' | 'angel' | 'cyber'`
- `theme: ThemeTokens`
- `admin_email`
- `stripe_public_key`
- `stripe_secret_key`
- `stripe_webhook_secret`
- `portfolio_site_url`
- `review_fallback_icon_url`
- `show_reviews_under_items`

## セクションデータ
- `hero`
- `about`
- `credo`
- `youtube_gallery`
- `illustration_gallery`
- `link_cards`
- `pricing`
- `faq`

## 今回追加したテーマ拡張
- `section_theme_presets: Partial<Record<SectionId, string>>`
  - セクションごとのプリセット割当
  - 例: `{ "hero": "hiro_001", "youtube_gallery": "cyber_003" }`
- `theme_presets_catalog: Array<{ id: string; label: string; tokens: ThemeTokens }>`
  - 管理画面で編集可能なプリセットカタログ
  - `id` はセクション割当の参照キー

## 3. 適用優先順位（テーマ）

1. セクションに `section_theme_presets[sectionId]` があり、`theme_presets_catalog` に一致する `id` が存在する  
   -> その `tokens` を適用
2. 上記がない場合  
   -> グローバル `theme` を適用

## 4. 後方互換ルール

- `section_theme_presets` 未保存時: 空オブジェクトとして扱う
- `theme_presets_catalog` 未保存時: 既定カタログ（white/angel/cyber）を使用
- 既存の `theme_preset + theme` は維持され、従来データでも表示崩れなく動作

## 5. 管理画面の編集ポイント（現状）

- `サイト設定 > 基本設定`
  - `セクション別テーマ割当`
  - `テーマプリセットカタログ編集`（追加/編集/削除）
- カタログ削除時
  - その `id` を参照している `section_theme_presets` は自動解除（継承へ戻す）

## 6. 関連実装ファイル

- `mebuki-portfolio-manager/admin-src/src/types/settings.ts`
- `mebuki-portfolio-manager/admin-src/src/lib/themePresets.ts`
- `mebuki-portfolio-manager/admin-src/src/lib/mergeSettings.ts`
- `mebuki-portfolio-manager/admin-src/src/components/settings/BasicSettingsCard.tsx`
- `mebuki-portfolio-manager/admin-src/src/frontend/sectionTheme.ts`
- `mebuki-portfolio-manager/admin-src/src/frontend/FrontendApp.tsx`
- `mebuki-portfolio-manager/admin-src/src/frontend/SectionRenderer.tsx`
- `mebuki-portfolio-manager/tests/integration/wordpress/test-api-settings.php`


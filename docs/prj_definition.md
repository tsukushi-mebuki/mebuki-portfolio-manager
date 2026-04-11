# Mebuki Works プロジェクト定義書 (Master Definition)

## 1. プロジェクト概要
- **プロダクト名**: Mebuki Works
- **ターゲット**: 高単価クリエイター（MIX師・絵師）
- **コア価値**: 手数料0%、自動見積もり、決済、タスク管理をスマホで完結させる独立特化型SaaS。
- **提供形態**: ヘッドレスWordPressをバックエンドとしたSaaS形式。

## 2. 技術スタック
- **Backend**: WordPress (PHP 8.x) + WP REST API
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: MySQL 8.0 (JSON型を多用する設計)
- **Security**: WP Nonce, sanitize_text_field, permission_callbackの徹底。

## 3. データモデル (厳守事項)
1. **mebuki_pm_settings**: 設定JSON（テーマ、マスターデータ等）を格納。
2. **mebuki_pm_orders**: 注文・見積もり・決済データ。UUIDによる冪等性確保。
3. **mebuki_pm_reviews**: 口コミデータ。1作品1口コミ、最新上書き、WebP対応。
※ すべてのテーブルに `user_id` を持ち、マルチテナントに対応させる。

## 4. 開発ルール
- コード生成時は必ずこの定義書の設計思想（堅牢性・保守性・SaaS拡張性）に従うこと。
- ビジネスロジックはReactのUIから分離し、テスト可能なピュア関数として実装すること。
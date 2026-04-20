# e2e/scenarios

E2E のテストシナリオ本体（例: 管理画面更新→フロント表示確認）を置くためのディレクトリです。

## Phase2 検証観点

- A/B ユーザーで各 `portfolio/{user_slug}` から送信した問い合わせ・口コミが、対応するオーナーの管理画面にのみ表示されること
- `user_slug` が不正（存在しない）な公開 API 呼び出しは `400` になること
- Stripe webhook の `metadata.owner_id` と注文 `user_id` が不一致の場合、注文ステータスが更新されないこと

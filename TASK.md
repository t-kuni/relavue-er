# タスク一覧

## 概要
データベース接続設定モーダルにローディング表示とエラーハンドリング機能を追加する。
仕様書: [spec/database_connection_settings.md](spec/database_connection_settings.md)

## タスク

### フロントエンド修正

- [x] `public/src/components/DatabaseConnectionModal.tsx` を修正
  - `loading: boolean` プロパティを追加
  - ローディング中の UI を実装
    - ローディングインジケーター（スピナー等）を表示
    - ローディング中メッセージ（例: 「データベースに接続中...」）を表示
    - 入力フィールド全てに `disabled` 属性を追加（`loading` が true の時）
    - 実行ボタンに `disabled` 属性を追加（`loading` が true の時）
    - キャンセルボタンに `disabled` 属性を追加（`loading` が true の時）
  - エラー表示とローディング表示は排他的に表示（同時に表示しない）

- [x] `public/src/components/App.tsx` を修正
  - `DatabaseConnectionModal` コンポーネントに `loading` プロパティを渡す
  - `loading` の値は `erDiagram.loading` を使用

### バックエンド修正

- [x] `server.ts` を修正
  - `/api/reverse-engineer` エンドポイントのエラーハンドリングを改善
  - データベースドライバーのエラーを適切に分類し、ユーザー向けのメッセージに変換する
  - エラーの種類に応じて適切な日本語メッセージを返す
    - 認証エラー: 「認証に失敗しました。ユーザー名またはパスワードを確認してください。」
    - 接続エラー: 「データベースサーバーに接続できません。ホストとポート番号を確認してください。」
    - データベース不存在: 「指定されたデータベースが見つかりません。データベース名を確認してください。」
    - スキーマ不存在（PostgreSQL）: 「指定されたスキーマが見つかりません。スキーマ名を確認してください。」
    - 権限不足: 「データベースへのアクセス権限がありません。ユーザーの権限を確認してください。」
    - その他のエラー: エラーの詳細を含む具体的なメッセージ
  - エラーコードやスタックトレースは含めない
  - 内部実装の詳細やシステムパスは含めない（セキュリティ対策）

- [x] `lib/usecases/ReverseEngineerUsecase.ts` を修正
  - エラーメッセージを日本語化・詳細化
  - 既存の英語エラーメッセージを日本語に変更
    - `'Database connection information is incomplete. Please provide all required fields.'` → 「データベース接続情報が不足しています。すべての必須フィールドを入力してください。」
    - `'Database password is not specified.'` → 「データベースパスワードが指定されていません。」
  - データベースドライバーのエラーをキャッチし、ユーザーフレンドリーなメッセージに変換する
  - エラーの種類を判別するロジックを追加（エラーコードやメッセージを使用）

### ビルドとテスト

- [x] コード生成を実行
  - `npm run generate` を実行して型定義を更新

- [x] ビルド確認
  - `npm run build` でビルドが通ることを確認
  - ビルドエラーが発生した場合は修正

- [x] テストコード更新
  - `tests/usecases/ReverseEngineerUsecase.test.ts` を更新
    - エラーメッセージが日本語化されたため、テストのエラーメッセージ検証を更新
    - 「Database connection information is incomplete」→「データベース接続情報が不足しています」
    - 「Database password is not specified」→「データベースパスワードが指定されていません」

- [x] テスト実行
  - `npm run test` でテストが通ることを確認
  - テストが失敗した場合は原因を調査・修正

## 注意事項

- `ERDiagramViewModel.loading` は既に `actionSetLoading` で管理されているため、新規追加は不要
- `reverseEngineerCommand.ts` は既に `actionSetLoading` を使用しているため、修正不要
- エラーメッセージはユーザーが理解しやすい日本語で記述する
- データベース固有のエラーコードを使用してエラー種別を判定する（MySQL: errno、PostgreSQL: code）

## 完了記録

**2026-02-08**: 全てのタスクが完了しました。

### 実施内容

1. **フロントエンド修正**
   - `DatabaseConnectionModal.tsx`: `loading`プロパティを追加し、ローディング中のUI（スピナー、メッセージ）を実装。全ての入力フィールドとボタンに`disabled`属性を追加。
   - `App.tsx`: `DatabaseConnectionModal`に`erDiagram.loading`を渡すよう修正。

2. **バックエンド修正**
   - `ReverseEngineerUsecase.ts`: エラーメッセージを日本語化し、`convertToUserFriendlyError`関数を追加。MySQL/PostgreSQLのエラーコードを判別し、ユーザーフレンドリーなメッセージに変換。
   - `server.ts`: `/api/reverse-engineer`エンドポイントのエラーハンドリングを改善。Usecaseで日本語化されたエラーメッセージを返却。

3. **ビルドとテスト**
   - コード生成: `npm run generate` 実行 ✓
   - テストコード更新: 日本語化されたエラーメッセージに合わせてテストを更新 ✓
   - テスト実行: 全264テストが成功 ✓
   - ビルド確認: ビルド成功 ✓

### 動作確認

- ローディング中は入力フィールド、実行ボタン、キャンセルボタンが無効化される
- ローディング中はスピナーと「データベースに接続中...」メッセージが表示される
- エラー発生時はユーザーフレンドリーな日本語メッセージが表示される
- エラー表示とローディング表示は排他的に表示される

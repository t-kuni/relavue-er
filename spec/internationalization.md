# 多言語対応（国際化）仕様

## 概要

ER Diagram Viewerの多言語対応（国際化）機能。日本語・英語・中国語（簡体字）の3言語をサポートし、ユーザーが言語を切り替えられるようにする。

リサーチ背景: [research/20260211_1143_i18n_implementation_strategy.md](/research/20260211_1143_i18n_implementation_strategy.md)

## 対応言語

初期リリースで以下の3言語をサポート：

- **日本語** (`ja`)
- **英語** (`en`)
- **中国語（簡体字）** (`zh`)

## 型定義

### Locale型

サポートする言語を表す型を `scheme/main.tsp` に追加：

```tsp
alias Locale = "ja" | "en" | "zh";
```

### AppSettings への追加

`scheme/main.tsp` の `AppSettings` モデルに `locale` フィールドを追加：

```tsp
model AppSettings {
  lastDatabaseConnection?: DatabaseConnectionState;
  locale?: Locale;  // 言語設定（未設定の場合はブラウザ設定から検出）
}
```

## 言語設定の優先順位

言語の決定は以下の優先順位で行う：

1. **ユーザーが明示的に選択した言語**（UI上で切り替え）
2. **保存済みの言語設定**（`ViewModel.settings.locale`）
3. **ブラウザの言語設定**（`navigator.languages` からネゴシエーション）
4. **デフォルト言語**（英語: `en`）

### ブラウザ言語の検出

- `navigator.languages` から優先言語リストを取得
- 言語タグを正規化（例: `"ja-JP"` → `"ja"`, `"zh-Hans-CN"` → `"zh"`）
- サポートする言語（`ja`, `en`, `zh`）にマッチするものを採用
- マッチしない場合はデフォルト言語（`en`）を使用

### 初期化時の処理

#### i18next初期化時（`public/src/i18n/index.ts`）

1. ブラウザ言語を検出（`detectBrowserLocale()` を使用）
2. 検出した言語をi18nextのデフォルト言語として設定
3. これにより、初回レンダリング時から適切な言語で表示される（ちらつき防止）

#### アプリケーション起動時（`commandInitialize`）

1. `GET /api/init` から初期ViewModelを取得
2. `ViewModel.settings.locale` が存在する場合：
   - その値を使用し、i18nextの言語を切り替え
   - ViewModelをStoreに反映
3. `ViewModel.settings.locale` が未設定の場合：
   - 既にi18next初期化時に検出した言語を使用
   - 検出した言語を `settings.locale` に設定
   - ViewModelをStoreに反映

## 翻訳対象

### UI要素

以下のUI要素を翻訳対象とする：

- **ヘッダー**: ボタンラベル、ツールチップ
- **サイドパネル**: タイトル、タブ名、セクション見出し、ラベル
- **モーダル**: タイトル、説明文、フォームラベル、ボタン、バリデーションメッセージ
- **エラーメッセージ**: API失敗、ファイル形式不正、バリデーション失敗など
- **トースト通知**: 成功メッセージ、エラーメッセージ
- **空状態メッセージ**: "選択してください"、"ドラッグしてください"など
- **ヒントテキスト**: プレースホルダー、ヘルプテキスト

### 翻訳対象外

以下は翻訳対象としない：

- **ユーザーが入力したデータ**: エンティティ名、カラム名、DDL、矩形・テキストの内容
- **技術用語（そのまま使用）**: ID、UUID、VARCHAR、INTEGER など

## 言語切り替えUI

### UI配置

ヘッダーに言語切り替えドロップダウンを配置：

**ヘッダーのボタン配置順序（左から右）**:
1. DBからリバースボタン（データベース接続ボタン）
2. リバース履歴ボタン（履歴ボタン）
3. 配置最適化ボタン
4. レイヤーボタン
5. エクスポートボタン
6. インポートボタン
7. ビルド情報ボタン
8. **言語切り替えドロップダウン**

### ドロップダウンの仕様

- **表示形式**: 現在選択中の言語のネイティブ表記を表示
  - 日本語選択時: "日本語"
  - 英語選択時: "English"
  - 中国語選択時: "中文"
- **ドロップダウンメニュー**: 3言語をネイティブ表記で表示
  - 日本語
  - English
  - 中文
- **選択時の動作**:
  - `actionSetLocale(viewModel, locale)` をdispatch
  - 画面全体が選択した言語で再描画される

## Action設計

### 言語切り替えAction

```typescript
actionSetLocale(viewModel: ViewModel, locale: Locale): ViewModel
```

- `viewModel.settings.locale` を更新
- ViewModelの参照を変更し、全コンポーネントの再描画をトリガー

### 実装時の注意事項

- i18next の言語切り替え（`i18n.changeLanguage(locale)`）と ViewModel の更新を連携させる
- i18next側の永続化機能（localStorage等）は使用せず、ViewModelを単一ソースとする

## エクスポート・インポート時の扱い

### エクスポート

- `settings.locale` は **保持する**（設定の一部としてエクスポート）
- エクスポート時に破棄する一時UI状態には含めない

### インポート

- インポートファイルに `settings.locale` が存在する場合:
  - その値を使用（バリデーション実施）
- `settings.locale` が存在しない場合（旧バージョンのファイル等）:
  - ブラウザ言語を検出して設定

### バリデーション

インポート時に `settings.locale` が存在する場合、以下をチェック：

- 値が `"ja" | "en" | "zh"` のいずれかであること
- 不正値の場合: ブラウザ言語検出にフォールバック

## 技術選定

### 使用ライブラリ

- **react-i18next**: v16.5.4以上
- **i18next**: v25.8.4以上

### 翻訳ファイルの配置

- 翻訳ファイルは `public/locales/{locale}/translation.json` に配置
- 初期実装ではバンドルに同梱（動的ロードは将来対応）

### 翻訳ファイルの構造

```json
{
  "header": {
    "export": "エクスポート",
    "import": "インポート",
    ...
  },
  "error": {
    "invalid_json": "JSONフォーマットが不正です",
    ...
  },
  ...
}
```

- ネストした構造で分類ごとに整理
- キーは英語のスネークケースまたはキャメルケース

## フロントエンドの実装方針

### i18nextの初期化

- アプリケーション起動時（`main.tsx`でのインポート時）にi18nextを初期化
- 初期化時にブラウザ言語を検出してデフォルト言語として設定（ちらつき防止）
- その後、`commandInitialize` で取得した `ViewModel.settings.locale` がある場合は上書き

### 翻訳関数の使用

- React コンポーネント内: `useTranslation()` フックを使用
- 翻訳関数: `t('header.export')` の形式で呼び出し

### 言語切り替え時の動作

1. ユーザーがドロップダウンで言語を選択
2. `actionSetLocale(viewModel, locale)` をdispatch
3. ViewModelが更新され、購読しているコンポーネントが再描画
4. i18next の言語を `i18n.changeLanguage(locale)` で切り替え
5. 画面全体が新しい言語で表示される

### 実装時の注意事項

- ViewModelの `settings.locale` を単一ソースとし、i18next側のlocalStorageは使用しない
- **ViewModel更新時にi18nextの言語も同期させる**
  - `App.tsx`で`useViewModel`を使ってlocaleを監視し、変更があれば`i18n.changeLanguage(locale)`を呼ぶ
  - これにより、初期化時・言語選択時・インポート時のすべてで自動的に言語が同期される
- 言語切り替え時に不要な再レンダリングが発生しないよう、`React.memo` を適切に使用
- i18next初期化時にブラウザ言語を検出して設定することで、初回レンダリング時のちらつきを防ぐ

## バックエンドへの影響

### API仕様

バックエンドAPIには影響なし。言語設定はフロントエンド専用。

- `GET /api/init`: 初期ViewModelに `settings.locale` を含めない（undefined）
- リバースエンジニアAPI: 言語設定には影響しない

### 実装時の注意事項

- サーバー側で言語の処理は不要
- ViewModelの `settings.locale` フィールドはスキーマ定義のみ追加

## テスト方針

### Actionのテスト

- `actionSetLocale` の単体テスト:
  - `settings.locale` が正しく更新されることを確認
  - 不正な言語コードの場合の処理を確認

### 統合テスト

- 言語切り替え後、UIが正しく翻訳されることを確認
- エクスポート/インポート時に言語設定が保持され、インポート後に言語が正しく反映されることを確認
  - エクスポートした言語でインポート後のUIがすべて表示されることを確認
- ブラウザ言語検出が正しく動作することを確認

### 翻訳の完全性チェック

- すべてのキーに対して3言語の翻訳が存在することを確認（将来的に自動チェック導入を検討）

## 関連仕様書

- [フロントエンド状態管理仕様](/spec/frontend_state_management.md) - Storeとアクションの設計
- [インポート・エクスポート機能仕様](/spec/import_export_feature.md) - エクスポート/インポート時の処理
- [scheme/main.tsp](/scheme/main.tsp) - データ型定義

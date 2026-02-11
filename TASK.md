# タスク一覧: 多言語対応（国際化）機能実装

## 概要

[spec/internationalization.md](/spec/internationalization.md) の仕様に基づき、日本語・英語・中国語（簡体字）の3言語に対応した国際化機能を実装する。

実装規模が大きいため、以下の4フェーズに分けて実装する：
- **フェーズ1**: 依存関係追加と型生成
- **フェーズ2**: フロントエンド基盤（i18n初期化、Action、ユーティリティ）
- **フェーズ3-1**: 言語切り替えUIと主要コンポーネントの多言語対応
- **フェーズ3-2**: 残りのコンポーネントの多言語対応
- **フェーズ4**: テストとビルド確認

## 関連仕様書

- [spec/internationalization.md](/spec/internationalization.md) - 多言語対応の全体仕様
- [spec/frontend_state_management.md](/spec/frontend_state_management.md) - Action設計
- [spec/import_export_feature.md](/spec/import_export_feature.md) - エクスポート/インポート時の言語設定の扱い
- [scheme/main.tsp](/scheme/main.tsp) - Locale型とAppSettings型の定義（既に追加済み）

---

## フェーズ1: 依存関係追加と型生成 ✅ 完了

### [x] 1-1. 依存関係の追加

**ファイル**: `package.json`

**変更内容**:
- `react-i18next`: v16.5.4以上を追加
- `i18next`: v25.8.4以上を追加

**コマンド**:
```bash
npm install react-i18next@^16.5.4 i18next@^25.8.4
```

**実施結果**: 完了。react-i18next@16.5.4とi18next@25.8.4をインストールしました。

### [x] 1-2. 型生成の実行

**コマンド**:
```bash
npm run generate
```

**確認事項**:
- `lib/generated/api-types.ts` に `Locale` 型が生成されていること
- `public/src/api/client/models/AppSettings.ts` に `locale` フィールドが追加されていること

**実施結果**: 完了。型生成が正常に完了し、以下を確認しました：
- `lib/generated/api-types.ts`の`AppSettings`スキーマに`locale`フィールド（"ja" | "en" | "zh"）が生成されている
- `public/src/api/client/models/AppSettings.ts`に`locale`フィールドがenum型（JA, EN, ZH）として正しく生成されている

### [x] 1-3. テストファイルの作成（actionSetLocale用）

**ファイル**: `public/tests/actions/globalUIActions.test.ts`（既存ファイルに追加）

**内容**:
- `actionSetLocale` の単体テスト
- `settings.locale` が正しく更新されることを確認
- 不変性が保たれることを確認（元のViewModelが変更されないこと）

**実施結果**: 完了。以下のテストケースを追加しました：
- 言語設定が正しく更新される
- 別の言語に切り替えられる
- 変化がない場合は同一参照を返す
- 元のViewModelが変更されない（不変性が保たれる）

**注意**: `actionSetLocale`はフェーズ2で実装予定のため、現時点ではテストは実行できません。

---

## フェーズ2: フロントエンド基盤（i18n初期化、Action、ユーティリティ） ✅ 完了

### [x] 2-1. i18nextの初期化設定ファイルの作成

**ファイル**: `public/src/i18n/index.ts`（新規作成）

**実施結果**: 完了。i18nextの初期化設定ファイルを作成しました。

**実装内容**:
- i18nextの初期化
- `react-i18next` の設定
- 翻訳リソースの読み込み（3言語分をインポート）
- デフォルト言語: `en`（初期化時はブラウザ言語検出前なので英語をデフォルトにする）
- フォールバック言語: `en`
- i18next側のlocalStorageは使用しない（`load: 'languageOnly'`, `caches: []`）

**注意事項**:
- ViewModelの `settings.locale` を単一ソースとするため、i18next側の永続化機能は無効化する
- アプリケーション起動時に `main.tsx` でインポートし、初期化を実行する

### [x] 2-2. 翻訳ファイルの作成（日本語）

**ファイル**: `public/locales/ja/translation.json`（新規作成）

**実施結果**: 完了。日本語の翻訳ファイルを作成しました。

**内容**:
以下のカテゴリ別に翻訳キーを定義：
- `header`: ヘッダーのボタンラベル（エクスポート、インポート、ビルド情報、DBからリバース、リバース履歴、配置最適化、レイヤー、言語切り替え）
- `layer_panel`: レイヤーパネルのラベル（タイトル、背景レイヤー、前景レイヤー、など）
- `history_panel`: 履歴パネルのラベル
- `ddl_panel`: DDLパネルのラベル
- `database_modal`: データベース接続モーダルのラベル
- `build_info_modal`: ビルド情報モーダルのラベル
- `rectangle_panel`: 矩形プロパティパネルのラベル
- `text_panel`: テキストプロパティパネルのラベル
- `error`: エラーメッセージ（JSONフォーマット不正、バリデーションエラー、など）
- `common`: 共通ラベル（閉じる、キャンセル、実行、など）

**注意事項**:
- すべてのUI要素の翻訳キーを網羅的にリストアップ
- キーは英語のスネークケースで統一
- 既存のハードコードされた日本語テキストを翻訳キーに置き換える

### [x] 2-3. 翻訳ファイルの作成（英語）

**ファイル**: `public/locales/en/translation.json`（新規作成）

**実施結果**: 完了。英語の翻訳ファイルを作成しました。

**内容**:
- 日本語翻訳ファイルと同じ構造で英語版を作成
- すべてのキーに対して英語の翻訳を提供

### [x] 2-4. 翻訳ファイルの作成（中国語）

**ファイル**: `public/locales/zh/translation.json`（新規作成）

**実施結果**: 完了。中国語（簡体字）の翻訳ファイルを作成しました。

**内容**:
- 日本語翻訳ファイルと同じ構造で中国語（簡体字）版を作成
- すべてのキーに対して中国語の翻訳を提供

### [x] 2-5. actionSetLocaleの実装

**ファイル**: `public/src/actions/globalUIActions.ts`（既存ファイルに追加）

**実施結果**: 完了。actionSetLocaleを実装しました。

**追加内容**:
```typescript
/**
 * 言語設定を変更する
 * @param viewModel 現在のViewModel
 * @param locale 設定する言語
 */
export function actionSetLocale(
  viewModel: ViewModel,
  locale: Locale
): ViewModel
```

**実装内容**:
- `viewModel.settings.locale` を更新
- 変化がない場合は同一参照を返す（最適化）
- i18next の言語切り替えはこのActionの外で実施（Commandまたはコンポーネント側）

### [x] 2-6. ブラウザ言語検出ユーティリティの実装

**ファイル**: `public/src/utils/detectBrowserLocale.ts`（新規作成）

**実施結果**: 完了。ブラウザ言語検出ユーティリティを実装しました。

**実装内容**:
```typescript
/**
 * ブラウザの言語設定から対応言語を検出する
 * @returns 検出された言語（ja, en, zh）、マッチしない場合は "en"
 */
export function detectBrowserLocale(): Locale
```

**処理フロー**:
1. `navigator.languages` から優先言語リストを取得
2. 各言語タグを正規化（例: `"ja-JP"` → `"ja"`, `"zh-Hans-CN"` → `"zh"`）
3. サポートする言語（`ja`, `en`, `zh`）にマッチするものを返す
4. マッチしない場合は `"en"` を返す

### [x] 2-7. インポート処理の更新（locale対応）

**ファイル**: `public/src/utils/importViewModel.ts`

**実施結果**: 完了。インポート時のlocaleバリデーションとフォールバック処理を追加しました。

**変更内容**:
1. インポート時に `settings.locale` のバリデーションを追加:
   - `settings.locale` が存在する場合、値が `"ja" | "en" | "zh"` のいずれかであることを確認
   - 不正値の場合は `detectBrowserLocale()` で検出した言語を設定（エラーは発生させない）
2. `settings.locale` が存在しない場合（旧バージョンのファイル等）:
   - `detectBrowserLocale()` で検出した言語を設定

**仕様書参照**: [spec/import_export_feature.md](/spec/import_export_feature.md) の「settings.locale フィールド」セクション

### [x] 2-8. エクスポート処理の確認

**ファイル**: `public/src/utils/exportViewModel.ts`

**実施結果**: 完了。settings.localeが既にエクスポート対象に含まれていることを確認しました。変更不要です。

**確認内容**:
- `settings.locale` が既にエクスポート対象に含まれていることを確認
- 現在の実装で `settings` フィールドを維持しているため、変更不要

### [x] 2-9. commandInitializeの更新（ブラウザ言語検出）

**ファイル**: `public/src/commands/initializeCommand.ts`

**実施結果**: 完了。ブラウザ言語検出とi18nextの言語切り替え処理を追加しました。

**変更内容**:
1. `GET /api/init` から取得した初期ViewModelを確認
2. `viewModel.settings?.locale` が未設定（`undefined`）の場合:
   - `detectBrowserLocale()` でブラウザ言語を検出
   - `viewModel.settings.locale` に検出した言語を設定
   - `i18n.changeLanguage(locale)` でi18nextの言語を切り替え
3. `viewModel.settings?.locale` が既に設定されている場合:
   - `i18n.changeLanguage(viewModel.settings.locale)` でi18nextの言語を切り替え
4. ViewModelをStoreに設定

**注意事項**:
- i18nextの初期化が完了してから実行する必要がある

### [x] 2-10. main.tsxの更新（i18n初期化）

**ファイル**: `public/src/main.tsx`

**実施結果**: 完了。i18nの初期化をインポートしました。

**変更内容**:
- `./i18n` をインポートして初期化を実行
- アプリケーションのレンダリング前にi18nextの初期化を完了させる

---

## フェーズ3-1: 言語切り替えUIと主要コンポーネントの多言語対応

### [ ] 3-1-1. 言語切り替えドロップダウンコンポーネントの作成

**ファイル**: `public/src/components/LocaleSelector.tsx`（新規作成）

**実装内容**:
- ドロップダウンUIの実装
- 現在選択中の言語をネイティブ表記で表示（日本語、English、中文）
- ドロップダウンメニューに3言語をネイティブ表記で表示
- 選択時に `actionSetLocale` をdispatchし、`i18n.changeLanguage(locale)` を実行
- `useViewModel` で現在の言語を購読

**スタイル**:
- ヘッダーの他のボタンと統一感のあるデザイン
- ドロップダウンはボタンクリックで表示/非表示

### [ ] 3-1-2. App.tsxへの言語切り替えUIの追加

**ファイル**: `public/src/components/App.tsx`

**変更内容**:
1. `LocaleSelector` コンポーネントをインポート
2. ヘッダーのボタン配置順序を更新:
   - レイヤー → エクスポート → インポート → ビルド情報 → DBからリバース → リバース履歴 → **言語切り替えドロップダウン（新規）** → ヘルプ（将来追加予定）
3. `useTranslation()` フックをインポートし、翻訳関数 `t` を取得
4. すべてのハードコードされたテキストを `t()` 関数で翻訳キーに置き換え

**仕様書参照**: [spec/internationalization.md](/spec/internationalization.md) の「言語切り替えUI」セクション

### [ ] 3-1-3. ERCanvasコンポーネントの多言語対応

**ファイル**: `public/src/components/ERCanvas.tsx`

**変更内容**:
- `useTranslation()` フックをインポート
- エラーメッセージやツールチップなどのテキストを `t()` で翻訳

### [ ] 3-1-4. DatabaseConnectionModalの多言語対応

**ファイル**: `public/src/components/DatabaseConnectionModal.tsx`

**変更内容**:
- `useTranslation()` フックをインポート
- モーダルのタイトル、フォームラベル、ボタンラベル、エラーメッセージを `t()` で翻訳

### [ ] 3-1-5. BuildInfoModalの多言語対応

**ファイル**: `public/src/components/BuildInfoModal.tsx`

**変更内容**:
- `useTranslation()` フックをインポート
- モーダルのタイトル、ラベル、ボタンを `t()` で翻訳

### [ ] 3-1-6. LayerPanelの多言語対応

**ファイル**: `public/src/components/LayerPanel.tsx`

**変更内容**:
- `useTranslation()` フックをインポート
- パネルのタイトル、セクション見出し、ラベルを `t()` で翻訳

### [ ] 3-1-7. HistoryPanelの多言語対応

**ファイル**: `public/src/components/HistoryPanel.tsx`

**変更内容**:
- `useTranslation()` フックをインポート
- パネルのタイトル、ラベル、メッセージを `t()` で翻訳

### [ ] 3-1-8. DDLPanelの多言語対応

**ファイル**: `public/src/components/DDLPanel.tsx`

**変更内容**:
- `useTranslation()` フックをインポート
- パネルのタイトル、ラベル、ボタンを `t()` で翻訳

### [ ] 3-1-9. RectanglePropertyPanelの多言語対応

**ファイル**: `public/src/components/RectanglePropertyPanel.tsx`

**変更内容**:
- `useTranslation()` フックをインポート
- パネルのタイトル、ラベル、ボタンを `t()` で翻訳

### [ ] 3-1-10. フェーズ3-1のビルド確認

**コマンド**:
```bash
npm run generate  # 念のため型生成を再実行
npm run --prefix public build
```

**確認事項**:
- ビルドエラーが発生しないこと
- 翻訳キーの参照エラーがないこと

---

## フェーズ3-2: 残りのコンポーネントの多言語対応

### [ ] 3-2-1. TextPropertyPanelの多言語対応

**ファイル**: `public/src/components/TextPropertyPanel.tsx`

**変更内容**:
- `useTranslation()` フックをインポート
- パネルのタイトル、ラベル、ボタンを `t()` で翻訳

### [ ] 3-2-2. EntityNodeの多言語対応

**ファイル**: `public/src/components/EntityNode.tsx`

**変更内容**:
- `useTranslation()` フックをインポート（必要に応じて）
- ツールチップやラベルを `t()` で翻訳（該当する場合のみ）

**注意事項**:
- エンティティ名やカラム名などのユーザーデータは翻訳対象外

### [ ] 3-2-3. EntityColumnの多言語対応

**ファイル**: `public/src/components/EntityColumn.tsx`

**変更内容**:
- `useTranslation()` フックをインポート（必要に応じて）
- ツールチップやラベルを `t()` で翻訳（該当する場合のみ）

**注意事項**:
- カラム名やデータ型などのユーザーデータは翻訳対象外

### [ ] 3-2-4. RelationshipEdgeの多言語対応

**ファイル**: `public/src/components/RelationshipEdge.tsx`

**変更内容**:
- `useTranslation()` フックをインポート（必要に応じて）
- ツールチップやラベルを `t()` で翻訳（該当する場合のみ）

### [ ] 3-2-5. SelfRelationshipEdgeの多言語対応

**ファイル**: `public/src/components/SelfRelationshipEdge.tsx`

**変更内容**:
- `useTranslation()` フックをインポート（必要に応じて）
- ツールチップやラベルを `t()` で翻訳（該当する場合のみ）

### [ ] 3-2-6. RectangleNodeの多言語対応

**ファイル**: `public/src/components/RectangleNode.tsx`

**変更内容**:
- `useTranslation()` フックをインポート（必要に応じて）
- ツールチップやラベルを `t()` で翻訳（該当する場合のみ）

**注意事項**:
- 矩形内のテキストはユーザーデータのため翻訳対象外

### [ ] 3-2-7. ColorPickerWithPresetsの多言語対応

**ファイル**: `public/src/components/ColorPickerWithPresets.tsx`

**変更内容**:
- `useTranslation()` フックをインポート（必要に応じて）
- ラベルやツールチップを `t()` で翻訳（該当する場合のみ）

### [ ] 3-2-8. LayoutProgressBarの多言語対応

**ファイル**: `public/src/components/LayoutProgressBar.tsx`

**変更内容**:
- `useTranslation()` フックをインポート
- プログレスバーのラベルやメッセージを `t()` で翻訳

### [ ] 3-2-9. フェーズ3-2のビルド確認

**コマンド**:
```bash
npm run --prefix public build
```

**確認事項**:
- ビルドエラーが発生しないこと
- 翻訳キーの参照エラーがないこと

---

## フェーズ4: テストとビルド確認

### [ ] 4-1. テストの実行

**コマンド**:
```bash
npm run test
```

**確認事項**:
- 既存のテストがすべてパスすること
- 新規追加したテスト（`actionSetLocale`）がパスすること

**テスト対象**:
- `actionSetLocale` の単体テスト
  - `settings.locale` が正しく更新されること
  - 変化がない場合は同一参照を返すこと

### [ ] 4-2. 型チェックの実行

**コマンド**:
```bash
npm run typecheck
```

**確認事項**:
- 型エラーが発生しないこと

### [ ] 4-3. 最終ビルド確認

**コマンド**:
```bash
npm run generate
npm run build
```

**確認事項**:
- バックエンドとフロントエンドの両方がビルドできること
- ビルドエラー・警告が発生しないこと

---

## 実装上の注意事項

### 翻訳キーの命名規則

- カテゴリごとにネストした構造を使用（例: `header.export`, `error.invalid_json`）
- キーは英語のスネークケースで統一
- 明確で自己説明的な名前を使用

### i18nextの設定

- ViewModelの `settings.locale` を単一ソースとする
- i18next側のlocalStorageは使用しない
- 言語切り替え時はActionとi18nextの両方を更新

### ブラウザ言語検出

- `navigator.languages` から優先言語リストを取得
- 言語タグを正規化（例: `"ja-JP"` → `"ja"`）
- サポートする言語にマッチしない場合は `"en"` を使用

### エクスポート/インポート

- エクスポート時に `settings.locale` を保持
- インポート時に `settings.locale` のバリデーションを実施
- 不正値の場合はブラウザ言語検出にフォールバック（エラーは発生させない）

### テストカバレッジ

- `actionSetLocale` の単体テスト
- ブラウザ言語検出のテストは将来的に追加（MVP段階では不要）

---

## 事前修正提案

特になし。現在の実装で問題なく多言語対応機能を追加できる。

# タスク一覧

## 概要

仕様書 `spec/internationalization.md` の更新に伴う実装タスク。
主に以下の2点の修正が必要：

1. i18next初期化時のブラウザ言語検出処理の追加（ちらつき防止のため）
2. ヘッダーのボタン配置順序の変更

## 関連仕様書

- [spec/internationalization.md](/spec/internationalization.md)

## 実装タスク

### i18next初期化処理の修正

- [x] `public/src/i18n/index.ts` を修正 ✅
  - i18next初期化時に `detectBrowserLocale()` を呼び出してブラウザ言語を検出
  - 検出した言語を `lng` パラメータに設定（現在は固定で `'en'` が設定されている）
  - これにより、初回レンダリング時から適切な言語で表示される（ちらつき防止）
  - 参照: `public/src/utils/detectBrowserLocale.ts` - ブラウザ言語検出関数
  - 修正内容:
    ```typescript
    import { detectBrowserLocale } from '../utils/detectBrowserLocale';
    
    i18n
      .use(initReactI18next)
      .init({
        // ...
        lng: detectBrowserLocale(), // 変更: 'en' → detectBrowserLocale()
        // ...
      });
    ```

### ヘッダーボタン配置順序の変更

- [x] `public/src/components/App.tsx` のヘッダー部分を修正 ✅
  - ボタンの配置順序を仕様書通りに変更
  - **新しい順序（左から右）**:
    1. DBからリバースボタン（`actionShowDatabaseConnectionModal`）
    2. リバース履歴ボタン（`actionToggleHistoryPanel`）
    3. 配置最適化ボタン（`handleLayoutOptimize`）
    4. レイヤーボタン（`actionToggleLayerPanel`）
    5. エクスポートボタン（`handleExport`）
    6. インポートボタン（`open`）
    7. ビルド情報ボタン（`actionShowBuildInfoModal`）
    8. 言語切り替えドロップダウン（`<LocaleSelector />`）
  - **変更前の順序**: レイヤー、エクスポート、インポート、ビルド情報、DBからリバース、リバース履歴、配置最適化、言語切り替え
  - 対象: App.tsx の `<header>` 内の `<div style={{ display: 'flex', gap: '8px' }}>` セクション（189行目付近）

### ビルド確認

- [x] コード生成を実行: `npm run generate` ✅
  - `scheme/main.tsp` から型定義を生成
  - 正常に完了
- [x] ビルドエラーがないか確認 ✅
  - エラーなし

### テスト実行

- [x] テストを実行: `npm run test` ✅
  - 既存のテストが通ることを確認（268個すべてのテストが成功）
  - 多言語対応機能のテストは本タスクでは対象外（将来的に追加予定）

## 備考

- 実装はほぼ完了しており、以下のコンポーネント・関数は既に実装済み：
  - `LocaleSelector` コンポーネント
  - `actionSetLocale` アクション
  - `detectBrowserLocale` 関数
  - 翻訳ファイル（`public/locales/{ja,en,zh}/translation.json`）
  - `commandInitialize` での言語設定の初期化処理
- 今回の修正は、初期化のタイミングとUI配置の調整のみ
- 修正対象ファイル数: 2ファイル（i18n/index.ts、App.tsx）のみ

## 実施結果

**✅ すべてのタスクが完了しました**

### 実施した変更

1. **i18next初期化処理の修正** (`public/src/i18n/index.ts`)
   - `detectBrowserLocale()` 関数をインポート
   - `lng` パラメータを `'en'` から `detectBrowserLocale()` に変更
   - これにより、初回レンダリング時から適切な言語で表示され、ちらつきが防止されます

2. **ヘッダーボタン配置順序の変更** (`public/src/components/App.tsx`)
   - ボタンの配置順序を仕様書通りに変更
   - 新しい順序: DBからリバース → リバース履歴 → 配置最適化 → レイヤー → エクスポート → インポート → ビルド情報 → 言語切り替え

3. **ビルド確認**
   - `npm run generate` を実行し、型定義を正常に生成
   - ビルドエラーなし

4. **テスト実行**
   - `npm run test` を実行し、268個すべてのテストが成功
   - 既存機能に影響なし

### まとめ

多言語対応に関する実装が完了しました。ブラウザの言語設定に基づいて初期言語が自動的に検出され、ユーザーに最適な言語で表示されるようになりました。また、ヘッダーのボタン配置も仕様書通りに修正されました。

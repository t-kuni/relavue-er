# 国際化（i18n）仕様書更新に伴うタスク一覧

仕様書: [spec/internationalization.md](/spec/internationalization.md)

## 参照仕様書
- [spec/semantic_versioning.md](./spec/semantic_versioning.md)
- [research/20260211_1153_semantic_versioning_strategy.md](./research/20260211_1153_semantic_versioning_strategy.md)
- [README_DEVELOP.md](./README_DEVELOP.md)（バージョンリリース運用のセクション）

仕様書の更新により、ViewModel更新時のi18next言語同期の実装方法が明確化されました。以下のタスクを実施します。

### 変更概要

1. **ViewModel更新時のi18next言語同期の自動化**
   - `App.tsx`で`useViewModel`を使ってlocaleを監視し、変更があれば`i18n.changeLanguage(locale)`を呼ぶ
   - これにより、初期化時・言語選択時・インポート時のすべてで自動的に言語が同期される

2. **統合テストの強化**
   - インポート後のUI表示確認を追加

## 実装タスク

### □ `App.tsx`にlocale監視のuseEffectを追加

### バージョニングフロー全体像

**変更内容**:
- `useViewModel`を使って`settings.locale`を監視する新しい`useEffect`を追加
- localeが変更された場合、`i18n.changeLanguage(locale)`を呼び出す
- これにより、以下のすべてのシナリオで自動的に言語が同期される：
  - 初期化時（`commandInitialize`で`ViewModel.settings.locale`が設定される）
  - 言語選択時（`actionSetLocale`でlocaleが更新される）
  - インポート時（`importViewModel`でlocaleが設定される）

**実装場所**:
- 既存のuseEffectの後に追加
- `i18n`は`useTranslation()`から取得（既にインポート済み）

**参考**: 仕様書 [spec/internationalization.md](/spec/internationalization.md) の「実装時の注意事項」セクション

### □ `LocaleSelector.tsx`から手動の`i18n.changeLanguage`呼び出しを削除

**ファイル**: `public/src/components/LocaleSelector.tsx`

**変更内容**:
- `handleLocaleChange`関数内の`i18n.changeLanguage(locale)`呼び出しを削除
- `actionSetLocale`のdispatchのみを残す
- 理由: `App.tsx`のlocale監視により自動的に言語が同期されるため、手動呼び出しは不要（重複を避ける）

**変更箇所**:
- 42-46行目の`handleLocaleChange`関数

**変更前**:
```typescript
const handleLocaleChange = (locale: AppSettings.locale) => {
  dispatch(actionSetLocale, locale)
  i18n.changeLanguage(locale)
  setIsOpen(false)
}
```

**変更後**:
```typescript
const handleLocaleChange = (locale: AppSettings.locale) => {
  dispatch(actionSetLocale, locale)
  setIsOpen(false)
}
```

**注意**: 
- `i18n`のインポートと`useTranslation()`の呼び出しも不要になる可能性がある（他で使用されていなければ削除）

## テストタスク

### □ インポート後のUI表示確認の統合テストを追加

**ファイル**: 新規作成 `public/tests/integration/i18n.test.tsx`

**テスト内容**:
1. **言語切り替え後、UIが正しく翻訳されることを確認**
   - 各言語（ja, en, zh）に切り替えて、ヘッダーのボタンテキストが正しく表示されることを確認

2. **エクスポート/インポート時に言語設定が保持され、インポート後に言語が正しく反映されることを確認**
   - 日本語でViewModelをエクスポート
   - ViewModelをインポート
   - インポート後のUIがすべて日本語で表示されることを確認
   - 同様に英語、中国語でもテスト

3. **ブラウザ言語検出が正しく動作することを確認**
   - localeが未設定のViewModelをインポート
   - ブラウザ言語が検出され、適切な言語で表示されることを確認

**参考**: 
- 仕様書 [spec/internationalization.md](/spec/internationalization.md) の「統合テスト」セクション
- 既存のテストファイル `public/tests/actions/globalUIActions.test.ts` を参考

**注意**:
- React Testing LibraryやVitestを使用
- `@testing-library/react`の`render`を使用してコンポーネントをレンダリング
- `screen.getByText()`などを使用してUI要素の翻訳を確認

### □ ビルドの確認

**実行コマンド**:
```bash
npm run generate && npm run build
```

**確認内容**:
- TypeScriptのコンパイルエラーがないこと
- ビルドが正常に完了すること

### □ テストの実行

**実行コマンド**:
```bash
npm run test
```

**確認内容**:
- すべてのテストがパスすること
- 特に以下のテストが正常に動作すること：
  - `public/tests/actions/globalUIActions.test.ts` の `actionSetLocale` テスト
  - 新規追加した `public/tests/integration/i18n.test.tsx` の統合テスト

## 備考

- 本タスクは小規模な修正のため、フェーズ分けは不要
- 既存の`actionSetLocale`の実装とテストは変更不要（正常に動作している）
- `importViewModel`の実装は既に仕様に準拠しているため、変更不要

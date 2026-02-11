/**
 * ブラウザの言語設定から対応言語を検出する
 * @returns 検出された言語（ja, en, zh）、マッチしない場合は "en"
 */
export function detectBrowserLocale(): 'ja' | 'en' | 'zh' {
  // サポートする言語のリスト
  const supportedLocales: ('ja' | 'en' | 'zh')[] = ['ja', 'en', 'zh'];

  // navigator.languages から優先言語リストを取得
  const browserLanguages = navigator.languages || [navigator.language];

  for (const lang of browserLanguages) {
    // 言語タグを正規化（例: "ja-JP" → "ja", "zh-Hans-CN" → "zh"）
    const normalizedLang = lang.toLowerCase().split('-')[0];

    // サポートする言語にマッチするか確認
    if (supportedLocales.includes(normalizedLang as 'ja' | 'en' | 'zh')) {
      return normalizedLang as 'ja' | 'en' | 'zh';
    }
  }

  // マッチしない場合は "en" を返す
  return 'en';
}

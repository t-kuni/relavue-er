import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 翻訳リソースのインポート
import ja from '../../locales/ja/translation.json';
import en from '../../locales/en/translation.json';
import zh from '../../locales/zh/translation.json';

// i18nextの初期化
i18n
  .use(initReactI18next) // react-i18nextの設定
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: 'en', // デフォルト言語（初期化時はブラウザ言語検出前なので英語）
    fallbackLng: 'en', // フォールバック言語
    load: 'languageOnly', // 'ja-JP' → 'ja' のように正規化
    interpolation: {
      escapeValue: false, // Reactは自動的にエスケープするため不要
    },
    // ViewModelのsettings.localeを単一ソースとするため、i18next側の永続化機能は無効化
    detection: {
      caches: [], // localStorageなどへのキャッシュを無効化
    },
  });

export default i18n;

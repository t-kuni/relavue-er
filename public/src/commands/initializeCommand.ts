import { DefaultService } from '../api/client';
import { actionSetViewModel } from '../actions/dataActions';
import type { Store } from '../store/erDiagramStore';
import { detectBrowserLocale } from '../utils/detectBrowserLocale';
import i18n from '../i18n';

/**
 * アプリケーション初期化Command
 * 初期ViewModelを取得してStoreに設定する
 * @param dispatch Store.dispatch関数
 */
export async function commandInitialize(
  dispatch: Store['dispatch']
): Promise<void> {
  try {
    const viewModel = await DefaultService.apiInitialize();
    
    // エラーレスポンスのチェック
    if ('error' in viewModel) {
      throw new Error(viewModel.error);
    }
    
    // 言語設定の確認と初期化
    let locale: 'ja' | 'en' | 'zh';
    
    if (viewModel.settings?.locale) {
      // 既に設定されている場合はその言語を使用
      locale = viewModel.settings.locale;
    } else {
      // 未設定の場合はブラウザ言語を検出
      locale = detectBrowserLocale();
      
      // ViewModelに検出した言語を設定
      viewModel.settings = {
        ...viewModel.settings,
        locale,
      };
    }
    
    // i18nextの言語を切り替え
    await i18n.changeLanguage(locale);
    
    // ViewModelをStoreに設定
    dispatch(actionSetViewModel, viewModel);
  } catch (error) {
    console.error('Failed to initialize:', error);
    // エラーはコンソールに出力するのみ（MVPフェーズ）
  }
}

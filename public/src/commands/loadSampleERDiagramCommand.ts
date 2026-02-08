import { DefaultService } from '../api/client';
import { actionMergeERData, actionSetLoading } from '../actions/dataActions';
import type { Store } from '../store/erDiagramStore';
import type { ViewModel } from '../api/client';

/**
 * サンプルER図を読み込むCommand
 * @param dispatch Store.dispatch関数
 * @param getState Store.getState関数
 * @returns 成功時は { success: true }、失敗時は { success: false, error: エラーメッセージ }
 */
export async function commandLoadSampleERDiagram(
  dispatch: Store['dispatch'],
  getState: Store['getState']
): Promise<{ success: boolean; error?: string }> {
  dispatch(actionSetLoading, true);
  
  try {
    // サーバーからサンプルER図を取得
    const response = await DefaultService.apiLoadSampleErDiagram();
    
    // エラーレスポンスのチェック
    if ('error' in response) {
      throw new Error((response as any).error);
    }
    
    // 現在のViewModelを取得
    const currentViewModel = getState() as ViewModel;
    
    // ERDataを既存ViewModelとマージ
    // connectionInfoは空のオブジェクトを渡す（仕様に従い、lastDatabaseConnectionは更新しない）
    dispatch(actionMergeERData, response.erData, {} as any);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to load sample ER diagram:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  } finally {
    dispatch(actionSetLoading, false);
  }
}

import type DatabaseManager from '../database/DatabaseManager.js';
import type { components } from '../generated/api-types.js';
import type { DatabaseConfig } from '../database/DatabaseManager.js';

// TypeSpecから生成された型を使用
export type ReverseEngineerRequest = components['schemas']['ReverseEngineerRequest'];
export type ReverseEngineerResponse = components['schemas']['ReverseEngineerResponse'];
export type ERData = components['schemas']['ERData'];
export type DatabaseConnectionState = components['schemas']['DatabaseConnectionState'];

export type ReverseEngineerDeps = {
  createDatabaseManager: () => DatabaseManager;
};

export function createReverseEngineerUsecase(deps: ReverseEngineerDeps) {
  return async (request: ReverseEngineerRequest): Promise<ReverseEngineerResponse> => {
    const dbManager = deps.createDatabaseManager();
    
    // リクエストから直接接続情報を取得
    const { type, host, port, user, password, database, schema } = request;
    
    // 接続情報の検証
    if (!host || !port || !user || !database) {
      throw new Error('データベース接続情報が不足しています。すべての必須フィールドを入力してください。');
    }
    
    // パスワードが空文字列の場合のみ環境変数をフォールバック
    const resolvedPassword = (password === '') ? process.env.DB_PASSWORD : password;
    
    if (!resolvedPassword) {
      throw new Error('データベースパスワードが指定されていません。');
    }
    
    const connectionConfig: DatabaseConfig = {
      type,
      host,
      port,
      user,
      password: resolvedPassword,
      database,
      schema,
    };
    
    try {
      await dbManager.connect(connectionConfig);
      
      // データベースからER図を生成
      const erData: ERData = await dbManager.generateERData();
      
      await dbManager.disconnect();
      
      // 接続情報を返却（パスワードを除く）
      const connectionInfo: DatabaseConnectionState = {
        type,
        host,
        port,
        user,
        database,
        schema,
      };
      
      // ReverseEngineerResponseを返却
      return {
        erData,
        connectionInfo,
      };
    } catch (error) {
      await dbManager.disconnect();
      
      // エラーメッセージを日本語化・詳細化
      const errorMessage = convertToUserFriendlyError(error, type);
      throw new Error(errorMessage);
    }
  };
}

// エラーをユーザーフレンドリーなメッセージに変換
function convertToUserFriendlyError(error: unknown, dbType: string): string {
  if (!(error instanceof Error)) {
    return 'データベース接続中に予期しないエラーが発生しました。';
  }

  const errorMessage = error.message.toLowerCase();
  const errorCode = (error as any).code;
  const errno = (error as any).errno;

  // MySQL エラー判定
  if (dbType === 'mysql') {
    // 認証エラー (ER_ACCESS_DENIED_ERROR)
    if (errno === 1045 || errorMessage.includes('access denied')) {
      return '認証に失敗しました。ユーザー名またはパスワードを確認してください。';
    }
    // 接続エラー (ECONNREFUSED, ETIMEDOUT, etc.)
    if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT' || errorMessage.includes('connect')) {
      return 'データベースサーバーに接続できません。ホストとポート番号を確認してください。';
    }
    // データベース不存在 (ER_BAD_DB_ERROR)
    if (errno === 1049 || errorMessage.includes('unknown database')) {
      return '指定されたデータベースが見つかりません。データベース名を確認してください。';
    }
    // 権限不足
    if (errorMessage.includes('permission') || errorMessage.includes('privilege')) {
      return 'データベースへのアクセス権限がありません。ユーザーの権限を確認してください。';
    }
  }

  // PostgreSQL エラー判定
  if (dbType === 'postgresql') {
    // 認証エラー (28P01: invalid_password, 28000: invalid_authorization_specification)
    if (errorCode === '28P01' || errorCode === '28000' || errorMessage.includes('password authentication failed')) {
      return '認証に失敗しました。ユーザー名またはパスワードを確認してください。';
    }
    // 接続エラー
    if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT' || errorMessage.includes('connect')) {
      return 'データベースサーバーに接続できません。ホストとポート番号を確認してください。';
    }
    // データベース不存在 (3D000: invalid_catalog_name)
    if (errorCode === '3D000' || errorMessage.includes('database') && errorMessage.includes('does not exist')) {
      return '指定されたデータベースが見つかりません。データベース名を確認してください。';
    }
    // スキーマ不存在 (3F000: invalid_schema_name)
    if (errorCode === '3F000' || errorMessage.includes('schema') && errorMessage.includes('does not exist')) {
      return '指定されたスキーマが見つかりません。スキーマ名を確認してください。';
    }
    // 権限不足 (42501: insufficient_privilege)
    if (errorCode === '42501' || errorMessage.includes('permission denied')) {
      return 'データベースへのアクセス権限がありません。ユーザーの権限を確認してください。';
    }
  }

  // その他のエラー（具体的なメッセージを含める）
  return `データベース接続中にエラーが発生しました: ${error.message}`;
}

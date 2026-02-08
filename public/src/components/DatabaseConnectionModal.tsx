import React, { useState, useEffect } from 'react'
import { DatabaseConnectionState } from '../api/client'

interface DatabaseConnectionModalProps {
  onExecute: (connectionInfo: DatabaseConnectionState, password: string) => void;
  onCancel: () => void;
  onLoadSample: () => void;
  initialValues?: DatabaseConnectionState;
  errorMessage?: string;
  hasExistingNodes: boolean;
  loading: boolean;
}

function DatabaseConnectionModal({ onExecute, onCancel, onLoadSample, initialValues, errorMessage, hasExistingNodes, loading }: DatabaseConnectionModalProps) {
  // スピナーアニメーションのスタイル
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  // 入力フォームの状態
  const [dbType, setDbType] = useState<DatabaseConnectionState.type>(initialValues?.type || DatabaseConnectionState.type.MYSQL)
  const [host, setHost] = useState(initialValues?.host || '')
  const [port, setPort] = useState(initialValues?.port?.toString() || '')
  const [user, setUser] = useState(initialValues?.user || '')
  const [password, setPassword] = useState('')
  const [database, setDatabase] = useState(initialValues?.database || '')
  const [schema, setSchema] = useState(initialValues?.schema || 'public')

  // Database Type変更時にportのデフォルト値を自動調整
  useEffect(() => {
    if (!initialValues?.port) {
      // 初期値がない場合のみ自動調整
      if (dbType === DatabaseConnectionState.type.MYSQL) {
        setPort('3306')
      } else if (dbType === DatabaseConnectionState.type.POSTGRESQL) {
        setPort('5432')
      }
    }
  }, [dbType, initialValues?.port])

  // ESCキーで閉じる処理
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  // 実行ボタンのハンドラ
  const handleExecute = () => {
    // Database Typeに応じたデフォルト値を設定
    const defaultPort = dbType === DatabaseConnectionState.type.POSTGRESQL ? 5432 : 3306
    const defaultUser = dbType === DatabaseConnectionState.type.POSTGRESQL ? 'postgres' : 'root'
    const defaultDatabase = dbType === DatabaseConnectionState.type.POSTGRESQL ? 'erviewer' : 'test'

    const connectionInfo: DatabaseConnectionState = {
      type: dbType,
      host: host || 'localhost',
      port: port ? parseInt(port, 10) : defaultPort,
      user: user || defaultUser,
      database: database || defaultDatabase,
    }

    // PostgreSQLの場合のみschemaを含める
    if (dbType === DatabaseConnectionState.type.POSTGRESQL) {
      connectionInfo.schema = schema || 'public'
    }

    onExecute(connectionInfo, password)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div 
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%'
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // クリップボード操作のキーイベントの伝播を止めて、ブラウザのデフォルト動作を優先
          const isClipboardOperation = (e.ctrlKey || e.metaKey) && 
            (e.key === 'c' || e.key === 'v' || e.key === 'x' || 
             e.key === 'C' || e.key === 'V' || e.key === 'X')
          if (isClipboardOperation) {
            e.stopPropagation()
          }
        }}
        onCopy={(e) => e.stopPropagation()}
        onCut={(e) => e.stopPropagation()}
        onPaste={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>データベース接続設定</h3>
        
        {errorMessage && !loading && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33'
          }}>
            {errorMessage}
          </div>
        )}

        {loading && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: '#e3f2fd',
            border: '1px solid #90caf9',
            borderRadius: '4px',
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '3px solid #90caf9',
              borderTop: '3px solid #1976d2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>データベースに接続中...</span>
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Database Type
          </label>
          <select
            value={dbType}
            onChange={(e) => setDbType(e.target.value as DatabaseConnectionState.type)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            <option value={DatabaseConnectionState.type.MYSQL}>MySQL</option>
            <option value={DatabaseConnectionState.type.POSTGRESQL}>PostgreSQL</option>
          </select>
        </div>

        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          color: '#856404',
          fontSize: '0.9rem'
        }}>
          ⚠️ information_schemaを参照するためルートユーザ（または十分な権限を持つユーザ）での実行を推奨します
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Host
          </label>
          <input 
            type="text" 
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="localhost"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Port
          </label>
          <input 
            type="number" 
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder={dbType === DatabaseConnectionState.type.POSTGRESQL ? '5432' : '3306'}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            User
          </label>
          <input 
            type="text" 
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder={dbType === DatabaseConnectionState.type.POSTGRESQL ? 'postgres' : 'root'}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Password
          </label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Database
          </label>
          <input 
            type="text" 
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            placeholder={dbType === DatabaseConnectionState.type.POSTGRESQL ? 'erviewer' : 'test'}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        {dbType === DatabaseConnectionState.type.POSTGRESQL && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Schema
            </label>
            <input 
              type="text" 
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              placeholder="public"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        )}

        {dbType !== DatabaseConnectionState.type.POSTGRESQL && (
          <div style={{ marginBottom: '1.5rem' }} />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
          {!hasExistingNodes && (
            <button 
              onClick={onLoadSample}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              サンプルERを読み込む
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              キャンセル
            </button>
            <button 
              onClick={handleExecute}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              実行
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatabaseConnectionModal

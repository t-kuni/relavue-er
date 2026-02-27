import React, { useEffect, useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { ReactFlowProvider } from '@xyflow/react'
import ERCanvas from './ERCanvas'
import BuildInfoModal from './BuildInfoModal'
import DatabaseConnectionModal from './DatabaseConnectionModal'
import LayoutProgressBar from './LayoutProgressBar'
import { RectanglePropertyPanel } from './RectanglePropertyPanel'
import { TextPropertyPanel } from './TextPropertyPanel'
import { LayerPanel } from './LayerPanel'
import { TableListPanel } from './TableListPanel'
import { HistoryPanel } from './HistoryPanel'
import DDLPanel from './DDLPanel'
import { LocaleSelector } from './LocaleSelector'
import { useViewModel, useDispatch } from '../store/hooks'
import { actionShowBuildInfoModal, actionHideBuildInfoModal, actionShowDatabaseConnectionModal, actionHideDatabaseConnectionModal, actionToggleHistoryPanel, actionToggleTableListPanel } from '../actions/globalUIActions'
import { actionSelectItem, actionToggleLayerPanel } from '../actions/layerActions'
import { actionSetViewModel } from '../actions/dataActions'
import { commandInitialize } from '../commands/initializeCommand'
import { commandReverseEngineer } from '../commands/reverseEngineerCommand'
import { commandLoadSampleERDiagram } from '../commands/loadSampleERDiagramCommand'
import { commandLayoutOptimize } from '../commands/layoutOptimizeCommand'
import { erDiagramStore } from '../store/erDiagramStore'
import { exportViewModel } from '../utils/exportViewModel'
import { importViewModel } from '../utils/importViewModel'
import type { DatabaseConnectionState } from '../api/client'

function App() {
  const { t, i18n } = useTranslation()
  const dispatch = useDispatch()
  const [dbConnectionError, setDbConnectionError] = useState<string | undefined>(undefined)
  const [nodesInitialized, setNodesInitialized] = useState<boolean>(false)
  const tableListInputRef = useRef<HTMLInputElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState<number>(250)
  
  // 初期化処理
  useEffect(() => {
    commandInitialize(dispatch)
  }, [])
  
  // Storeから状態を取得
  const selectedItem = useViewModel((vm) => vm.ui.selectedItem)
  const showBuildInfo = useViewModel((vm) => vm.ui.showBuildInfoModal)
  const showDatabaseConnectionModal = useViewModel((vm) => vm.ui.showDatabaseConnectionModal)
  const showLayerPanel = useViewModel((vm) => vm.ui.showLayerPanel)
  const showTableListPanel = useViewModel((vm) => vm.ui.showTableListPanel)
  const showHistoryPanel = useViewModel((vm) => vm.ui.showHistoryPanel)
  const viewModel = useViewModel((vm) => vm)
  const buildInfo = useViewModel((vm) => vm.buildInfo)
  const lastDatabaseConnection = useViewModel((vm) => vm.settings?.lastDatabaseConnection)
  const erDiagram = useViewModel((vm) => vm.erDiagram)
  const layoutOptimization = useViewModel((vm) => vm.ui.layoutOptimization)
  const locale = useViewModel((vm) => vm.settings?.locale)
  
  // エクスポートハンドラ
  const handleExport = () => {
    exportViewModel(viewModel)
  }
  
  // キーボードショートカット（Ctrl+S / Cmd+S でエクスポート、Ctrl+F / Cmd+F でテーブル一覧パネル）
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey

      // Ctrl+S / Cmd+S でエクスポート
      if (isCtrlOrCmd && event.key === 's') {
        event.preventDefault()
        handleExport()
      }

      // Ctrl+F / Cmd+F でテーブル一覧パネルを開く/フォーカス
      if (isCtrlOrCmd && event.key === 'f') {
        const inputElement = tableListInputRef.current
        const isInputFocused = document.activeElement === inputElement

        // パネルが閉じている場合：パネルを開き、入力欄にフォーカス
        if (!showTableListPanel) {
          event.preventDefault()
          dispatch(actionToggleTableListPanel)
          // パネルが開いた直後にフォーカスするため、次のフレームで実行
          setTimeout(() => {
            tableListInputRef.current?.focus()
          }, 0)
        }
        // パネルが開いていて入力欄にフォーカスが当たっていない場合：入力欄にフォーカス
        else if (!isInputFocused) {
          event.preventDefault()
          inputElement?.focus()
        }
        // パネルが開いていて入力欄にフォーカスが当たっている場合：ブラウザのデフォルト動作を許可
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewModel, showTableListPanel, dispatch])
  
  // ViewModel更新時にi18nextの言語を同期
  useEffect(() => {
    if (locale) {
      i18n.changeLanguage(locale)
    }
  }, [locale, i18n])
  
  // インポートハンドラ
  const handleImport = async (files: File[]) => {
    if (files.length === 0) return
    
    try {
      const importedViewModel = await importViewModel(files[0], buildInfo)
      dispatch(actionSetViewModel, importedViewModel)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`${t('error.import_failed')}: ${errorMessage}`)
    }
  }
  
  // react-dropzoneの設定
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleImport,
    accept: {
      'application/json': ['.json']
    },
    noClick: true, // 画面全体がクリック可能にならないように
    noKeyboard: true,
  })
  
  // 選択変更ハンドラ
  const handleSelectionChange = (rectangleId: string | null) => {
    if (rectangleId === null) {
      dispatch(actionSelectItem, null)
    } else {
      dispatch(actionSelectItem, { kind: 'rectangle', id: rectangleId })
    }
  }
  
  // データベース接続モーダルの実行ハンドラ
  const handleDatabaseConnectionExecute = async (connectionInfo: DatabaseConnectionState, password: string) => {
    const result = await commandReverseEngineer(dispatch, erDiagramStore.getState, connectionInfo, password)
    
    if (result.success) {
      // 成功時はモーダルを閉じる
      dispatch(actionHideDatabaseConnectionModal)
      setDbConnectionError(undefined)
    } else {
      // 失敗時はエラーメッセージを設定（モーダルは開いたまま）
      setDbConnectionError(result.error)
    }
  }
  
  // データベース接続モーダルのキャンセルハンドラ
  const handleDatabaseConnectionCancel = () => {
    dispatch(actionHideDatabaseConnectionModal)
    setDbConnectionError(undefined)
  }
  
  // サンプルER図読み込みハンドラ
  const handleLoadSampleERDiagram = async () => {
    const result = await commandLoadSampleERDiagram(dispatch, erDiagramStore.getState)
    
    if (result.success) {
      dispatch(actionHideDatabaseConnectionModal)
      setDbConnectionError(undefined)
    } else {
      setDbConnectionError(result.error)
    }
  }
  
  // 配置最適化ボタンのハンドラ
  const handleLayoutOptimize = () => {
    commandLayoutOptimize(dispatch, erDiagramStore.getState)
  }
  
  // 配置最適化ボタンの有効/無効判定
  const hasValidNodeSize = Object.values(erDiagram.nodes).some(node => node.width > 0)
  const isLayoutOptimizeDisabled =
    erDiagram.loading ||
    layoutOptimization.isRunning ||
    Object.keys(erDiagram.nodes).length === 0 ||
    !nodesInitialized ||
    !hasValidNodeSize

  // サイドバーリサイズハンドラー
  const handleResizeStart = (event: React.MouseEvent) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = sidebarWidth

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const delta = e.clientX - startX
      const newWidth = Math.max(150, Math.min(600, startWidth + delta))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }
  
  // リバースエンジニアボタンのラベルを動的に決定
  const reverseButtonLabel = (erDiagram.history?.length ?? 0) >= 1 
    ? t('header.reverse_engineer_incremental') 
    : t('header.reverse_engineer')
  
  return (
    <div className="app" {...getRootProps()}>
      <input {...getInputProps()} />
      <ReactFlowProvider>
      {isDragActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(68, 68, 68, 0.9)',
          border: '3px dashed #fff',
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          {t('common.drop_file_to_import')}
        </div>
      )}
      <header 
        style={{ 
          padding: '1rem', 
          background: '#333', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h1 style={{ margin: 0 }}>{t('header.app_title')}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => dispatch(actionShowDatabaseConnectionModal)}
            style={{
              padding: '0.5rem 1rem',
              background: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {reverseButtonLabel}
          </button>
          <button 
            onClick={() => dispatch(actionToggleHistoryPanel)}
            style={{
              padding: '0.5rem 1rem',
              background: showHistoryPanel ? '#777' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('header.reverse_history')}
          </button>
          <button 
            onClick={handleLayoutOptimize}
            disabled={isLayoutOptimizeDisabled}
            style={{
              padding: '0.5rem 1rem',
              background: isLayoutOptimizeDisabled ? '#888' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLayoutOptimizeDisabled ? 'not-allowed' : 'pointer',
              opacity: isLayoutOptimizeDisabled ? 0.6 : 1
            }}
          >
            {t('header.layout_optimize')}
          </button>
          <button
            onClick={() => dispatch(actionToggleLayerPanel)}
            style={{
              padding: '0.5rem 1rem',
              background: showLayerPanel ? '#777' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('header.layer')}
          </button>
          <button
            onClick={() => dispatch(actionToggleTableListPanel)}
            style={{
              padding: '0.5rem 1rem',
              background: showTableListPanel ? '#777' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('header.table_list')}
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '0.5rem 1rem',
              background: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('header.export')}
          </button>
          <button 
            onClick={open}
            style={{
              padding: '0.5rem 1rem',
              background: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('header.import')}
          </button>
          <button 
            onClick={() => dispatch(actionShowBuildInfoModal)}
            style={{
              padding: '0.5rem 1rem',
              background: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('header.build_info')}
          </button>
          <LocaleSelector />
        </div>
      </header>
      <main style={{ 
        display: 'flex', 
        height: 'calc(100vh - 70px)' 
      }}>
        {showLayerPanel && (
          <div style={{
            width: `${sidebarWidth}px`,
            background: '#f5f5f5',
            borderRight: '1px solid #ddd',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <LayerPanel />
            <div
              onMouseDown={handleResizeStart}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                cursor: 'col-resize',
                background: 'transparent',
                zIndex: 10
              }}
            />
          </div>
        )}
        {showTableListPanel && (
          <div style={{
            width: `${sidebarWidth}px`,
            background: '#f5f5f5',
            borderRight: '1px solid #ddd',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <TableListPanel inputRef={tableListInputRef} />
            <div
              onMouseDown={handleResizeStart}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                cursor: 'col-resize',
                background: 'transparent',
                zIndex: 10
              }}
            />
          </div>
        )}
        <div style={{ 
          flex: 1, 
          position: 'relative' 
        }}>
          <ERCanvas 
            onSelectionChange={handleSelectionChange}
            onNodesInitialized={setNodesInitialized}
          />
        </div>
        {showHistoryPanel && (
          <div style={{ 
            width: '350px', 
            background: '#f5f5f5', 
            borderLeft: '1px solid #ddd', 
            overflowY: 'auto' 
          }}>
            <HistoryPanel />
          </div>
        )}
        {selectedItem && (
          <div 
            style={{ 
              width: selectedItem.kind === 'entity' ? '420px' : '300px', 
              minWidth: selectedItem.kind === 'entity' ? '360px' : '300px',
              maxWidth: selectedItem.kind === 'entity' ? '50vw' : '300px',
              background: '#ffffff', 
              borderLeft: '1px solid #ddd', 
              overflowY: 'auto' 
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {selectedItem.kind === 'rectangle' && (
              <RectanglePropertyPanel rectangleId={selectedItem.id} />
            )}
            {selectedItem.kind === 'text' && (
              <TextPropertyPanel textId={selectedItem.id} />
            )}
            {selectedItem.kind === 'entity' && (
              <DDLPanel />
            )}
          </div>
        )}
      </main>
      {showBuildInfo && (
        <BuildInfoModal onClose={() => dispatch(actionHideBuildInfoModal)} />
      )}
      {showDatabaseConnectionModal && (
        <DatabaseConnectionModal 
          onExecute={handleDatabaseConnectionExecute}
          onCancel={handleDatabaseConnectionCancel}
          onLoadSample={handleLoadSampleERDiagram}
          hasExistingNodes={Object.keys(erDiagram.nodes).length > 0}
          initialValues={lastDatabaseConnection}
          errorMessage={dbConnectionError}
          loading={erDiagram.loading}
        />
      )}
      <LayoutProgressBar />
      </ReactFlowProvider>
    </div>
  )
}

export default App

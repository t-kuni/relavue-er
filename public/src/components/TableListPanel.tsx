import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReactFlow, useViewport } from '@xyflow/react'
import { useViewModel, useDispatch } from '../store/hooks'
import { actionSelectItem } from '../actions/layerActions'

/**
 * テーブル名を正規化する（スペース・アンダースコアを除去し小文字に統一）
 */
function normalizeName(name: string): string {
  return name.replace(/[\s_]/g, '').toLowerCase()
}

/**
 * 正規化済み検索語が正規化済みテーブル名の部分列（subsequence）かどうかを判定する
 */
function isSubsequence(query: string, target: string): boolean {
  let queryIndex = 0
  for (let i = 0; i < target.length && queryIndex < query.length; i++) {
    if (target[i] === query[queryIndex]) {
      queryIndex++
    }
  }
  return queryIndex === query.length
}

/**
 * テーブル一覧パネル
 * ER図に含まれるエンティティの一覧をファジー検索とともに表示する
 */
export function TableListPanel() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { setCenter } = useReactFlow()
  const viewport = useViewport()
  const nodes = useViewModel((vm) => vm.erDiagram.nodes)

  // フィルターテキストはローカル状態で管理
  const [filterText, setFilterText] = useState('')

  // ノードをアルファベット順にソートし、ファジーマッチングで絞り込む
  const filteredNodes = Object.values(nodes)
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((node) => {
      if (!filterText) return true
      const normalizedQuery = normalizeName(filterText)
      const normalizedTarget = normalizeName(node.name)
      return isSubsequence(normalizedQuery, normalizedTarget)
    })

  const handleTableClick = (entityId: string) => {
    const node = nodes[entityId]
    if (!node) return

    // エンティティを選択状態にする
    dispatch(actionSelectItem, { kind: 'entity', id: entityId })

    // ER図キャンバスを該当エンティティが画面中央に来るようにパン
    setCenter(
      node.x + node.width / 2,
      node.y + node.height / 2,
      { zoom: viewport.zoom, duration: 500 }
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
        {t('table_list_panel.title')}
      </h3>
      <input
        type="text"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder={t('table_list_panel.filter_placeholder')}
        style={{
          width: '100%',
          padding: '6px 8px',
          marginBottom: '12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '13px',
          boxSizing: 'border-box',
        }}
      />
      {filteredNodes.length === 0 ? (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: '#999',
          fontSize: '12px',
          border: '1px dashed #ddd',
          borderRadius: '4px',
        }}>
          {t('table_list_panel.empty')}
        </div>
      ) : (
        filteredNodes.map((node) => (
          <div
            key={node.id}
            onClick={() => handleTableClick(node.id)}
            style={{
              padding: '8px 12px',
              margin: '4px 0',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e3f2fd'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff'
            }}
          >
            {node.name}
          </div>
        ))
      )}
    </div>
  )
}

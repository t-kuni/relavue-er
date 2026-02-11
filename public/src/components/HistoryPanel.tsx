import React from 'react';
import { useTranslation } from 'react-i18next';
import { useViewModel } from '../store/hooks';
import type {
  ReverseEngineeringHistoryEntry,
  ReverseEngineeringSummary,
  ReverseEngineeringChanges,
  ColumnModification,
  ColumnSnapshot,
} from '../api/client';

/**
 * サマリーテキストを生成する
 * 例: "+3テーブル, -1テーブル, +5カラム, ~2カラム"
 */
function formatSummary(summary: ReverseEngineeringSummary | undefined, t: any): string {
  if (!summary) return t('history_panel.summary_none');

  const parts: string[] = [];

  if (summary.addedTables > 0) parts.push(`+${summary.addedTables}${t('history_panel.added_tables')}`);
  if (summary.removedTables > 0) parts.push(`-${summary.removedTables}${t('history_panel.removed_tables')}`);
  if (summary.addedColumns > 0) parts.push(`+${summary.addedColumns}${t('history_panel.added_columns')}`);
  if (summary.removedColumns > 0) parts.push(`-${summary.removedColumns}${t('history_panel.removed_columns')}`);
  if (summary.modifiedColumns > 0) parts.push(`~${summary.modifiedColumns}${t('history_panel.modified_columns')}`);
  if (summary.addedRelationships > 0) parts.push(`+${summary.addedRelationships}${t('history_panel.added_relationships')}`);
  if (summary.removedRelationships > 0) parts.push(`-${summary.removedRelationships}${t('history_panel.removed_relationships')}`);

  if (parts.length === 0) {
    return t('history_panel.no_changes');
  }

  return parts.join(', ');
}

/**
 * リレーション参照を文字列で表現する
 */
function formatRelationshipRef(rel: {
  constraintName?: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}): string {
  if (rel.constraintName) {
    return `${rel.constraintName} (${rel.fromTable}.${rel.fromColumn} -> ${rel.toTable}.${rel.toColumn})`;
  }
  return `${rel.fromTable}.${rel.fromColumn} -> ${rel.toTable}.${rel.toColumn}`;
}

/**
 * ColumnSnapshotの差分を表示用の文字列に変換する
 */
function formatColumnSnapshot(snapshot: ColumnSnapshot): string {
  const parts: string[] = [];
  if (snapshot.key) parts.push(`key: ${snapshot.key}`);
  if (snapshot.isForeignKey) parts.push(`FK`);
  return parts.join(', ');
}

/**
 * カラム変更の詳細を表示するコンポーネント
 */
function ColumnModificationItem({ mod }: { mod: ColumnModification }) {
  const { t } = useTranslation();
  
  return (
    <div style={{ marginBottom: '8px', paddingLeft: '16px' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {mod.tableName}.{mod.columnName}
      </div>
      <div style={{ fontSize: '12px', color: '#666', paddingLeft: '8px' }}>
        <div>{t('history_panel.before')}: {formatColumnSnapshot(mod.before)}</div>
        <div>{t('history_panel.after')}: {formatColumnSnapshot(mod.after)}</div>
      </div>
    </div>
  );
}

/**
 * 変更詳細を表示するコンポーネント
 */
function ChangesDetail({ changes }: { changes: ReverseEngineeringChanges | undefined }) {
  const { t } = useTranslation();
  
  if (!changes) {
    return (
      <div style={{ padding: '8px', color: '#999', fontSize: '12px' }}>
        {t('history_panel.changes_detail_none')}
      </div>
    );
  }

  const hasChanges =
    (changes.tables?.added && changes.tables.added.length > 0) ||
    (changes.tables?.removed && changes.tables.removed.length > 0) ||
    (changes.columns?.added && changes.columns.added.length > 0) ||
    (changes.columns?.removed && changes.columns.removed.length > 0) ||
    (changes.columns?.modified && changes.columns.modified.length > 0) ||
    (changes.relationships?.added && changes.relationships.added.length > 0) ||
    (changes.relationships?.removed && changes.relationships.removed.length > 0);

  if (!hasChanges) {
    return (
      <div style={{ padding: '8px', color: '#999', fontSize: '12px' }}>
        {t('history_panel.no_changes')}
      </div>
    );
  }

  return (
    <div style={{ padding: '8px', fontSize: '13px' }}>
      {/* テーブルの追加 */}
      {changes.tables?.added && changes.tables.added.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#2e7d32' }}>
            {t('history_panel.tables_added')} ({changes.tables.added.length})
          </div>
          <ul style={{ margin: '0', paddingLeft: '24px' }}>
            {changes.tables.added.map((tableName) => (
              <li key={tableName}>{tableName}</li>
            ))}
          </ul>
        </div>
      )}

      {/* テーブルの削除 */}
      {changes.tables?.removed && changes.tables.removed.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#c62828' }}>
            {t('history_panel.tables_removed')} ({changes.tables.removed.length})
          </div>
          <ul style={{ margin: '0', paddingLeft: '24px' }}>
            {changes.tables.removed.map((tableName) => (
              <li key={tableName}>{tableName}</li>
            ))}
          </ul>
        </div>
      )}

      {/* カラムの追加 */}
      {changes.columns?.added && changes.columns.added.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#2e7d32' }}>
            {t('history_panel.columns_added')} ({changes.columns.added.length})
          </div>
          <ul style={{ margin: '0', paddingLeft: '24px' }}>
            {changes.columns.added.map((col) => (
              <li key={`${col.tableName}.${col.columnName}`}>
                {col.tableName}.{col.columnName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* カラムの削除 */}
      {changes.columns?.removed && changes.columns.removed.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#c62828' }}>
            {t('history_panel.columns_removed')} ({changes.columns.removed.length})
          </div>
          <ul style={{ margin: '0', paddingLeft: '24px' }}>
            {changes.columns.removed.map((col) => (
              <li key={`${col.tableName}.${col.columnName}`}>
                {col.tableName}.{col.columnName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* カラムの変更 */}
      {changes.columns?.modified && changes.columns.modified.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#f57c00' }}>
            {t('history_panel.columns_modified')} ({changes.columns.modified.length})
          </div>
          {changes.columns.modified.map((mod) => (
            <ColumnModificationItem key={`${mod.tableName}.${mod.columnName}`} mod={mod} />
          ))}
        </div>
      )}

      {/* リレーションの追加 */}
      {changes.relationships?.added && changes.relationships.added.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#2e7d32' }}>
            {t('history_panel.relationships_added')} ({changes.relationships.added.length})
          </div>
          <ul style={{ margin: '0', paddingLeft: '24px', fontSize: '12px' }}>
            {changes.relationships.added.map((rel, idx) => (
              <li key={idx}>{formatRelationshipRef(rel)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* リレーションの削除 */}
      {changes.relationships?.removed && changes.relationships.removed.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#c62828' }}>
            {t('history_panel.relationships_removed')} ({changes.relationships.removed.length})
          </div>
          <ul style={{ margin: '0', paddingLeft: '24px', fontSize: '12px' }}>
            {changes.relationships.removed.map((rel, idx) => (
              <li key={idx}>{formatRelationshipRef(rel)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * 履歴エントリを表示するコンポーネント
 */
function HistoryEntryItem({ entry }: { entry: ReverseEngineeringHistoryEntry }) {
  const { t, i18n } = useTranslation();
  const date = new Date(entry.timestamp);
  const dateString = date.toLocaleString(i18n.language);
  const typeLabel = entry.entryType === 'initial' ? t('history_panel.entry_type_initial') : t('history_panel.entry_type_incremental');
  const summaryText = formatSummary(entry.summary, t);

  return (
    <details
      style={{
        marginBottom: '8px',
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#fff',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontWeight: 'bold',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'inline-block', width: '100%' }}>
          <div style={{ fontSize: '13px' }}>
            {dateString}
            <span
              style={{
                marginLeft: '8px',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '11px',
                backgroundColor: entry.entryType === 'initial' ? '#e3f2fd' : '#fff3e0',
                color: entry.entryType === 'initial' ? '#1976d2' : '#f57c00',
              }}
            >
              {typeLabel}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {summaryText}
          </div>
        </div>
      </summary>
      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
        <ChangesDetail changes={entry.changes} />
      </div>
    </details>
  );
}

/**
 * 履歴パネルコンポーネント
 */
export function HistoryPanel() {
  const { t } = useTranslation();
  const history = useViewModel((vm) => vm.erDiagram.history);

  // 履歴を新しい順にソート
  const sortedHistory = React.useMemo(() => {
    if (!history || history.length === 0) return [];
    return [...history].sort((a, b) => b.timestamp - a.timestamp);
  }, [history]);

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
        {t('history_panel.title')}
      </h3>

      {sortedHistory.length === 0 ? (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#999',
            fontSize: '12px',
            border: '1px dashed #ddd',
            borderRadius: '4px',
          }}
        >
          {t('history_panel.no_history')}
        </div>
      ) : (
        <div>
          {sortedHistory.map((entry, index) => (
            <HistoryEntryItem key={`${entry.timestamp}-${index}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

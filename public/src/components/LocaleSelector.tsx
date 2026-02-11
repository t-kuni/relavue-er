import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useViewModel, useDispatch } from '../store/hooks'
import { actionSetLocale } from '../actions/globalUIActions'
import type { AppSettings } from '../api/client'

// ロケールの表示名（ネイティブ表記）
const LOCALE_LABELS: Record<AppSettings.locale, string> = {
  [AppSettings.locale.JA]: '日本語',
  [AppSettings.locale.EN]: 'English',
  [AppSettings.locale.ZH]: '中文',
}

/**
 * 言語切り替えドロップダウンコンポーネント
 */
export function LocaleSelector() {
  const { i18n } = useTranslation()
  const dispatch = useDispatch()
  const currentLocale = useViewModel((vm) => vm.settings?.locale ?? AppSettings.locale.EN)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ドロップダウンを閉じる処理（外側クリック検出）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 言語切り替えハンドラ
  const handleLocaleChange = (locale: AppSettings.locale) => {
    dispatch(actionSetLocale, locale)
    i18n.changeLanguage(locale)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* ドロップダウンボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.5rem 1rem',
          background: isOpen ? '#777' : '#555',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span>{LOCALE_LABELS[currentLocale]}</span>
        <span style={{ fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            minWidth: '120px',
            zIndex: 1000,
          }}
        >
          {Object.values(AppSettings.locale).map((locale) => (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                background: locale === currentLocale ? '#f0f0f0' : 'transparent',
                color: '#333',
                border: 'none',
                borderRadius: '0',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: locale === currentLocale ? 'bold' : 'normal',
              }}
              onMouseEnter={(e) => {
                if (locale !== currentLocale) {
                  e.currentTarget.style.background = '#e8e8e8'
                }
              }}
              onMouseLeave={(e) => {
                if (locale !== currentLocale) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

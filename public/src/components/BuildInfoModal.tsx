import React from 'react'
import { useTranslation } from 'react-i18next'
import { useViewModel } from '../store/hooks'

interface BuildInfoModalProps {
  onClose: () => void
}

function BuildInfoModal({ onClose }: BuildInfoModalProps) {
  const { t } = useTranslation()
  
  // Storeからビルド情報を取得（初期化時にキャッシュ済み）
  const buildInfo = useViewModel((vm) => vm.buildInfo.data)
  const loading = useViewModel((vm) => vm.buildInfo.loading)
  const error = useViewModel((vm) => vm.buildInfo.error)

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
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0 }}>{t('build_info_modal.title')}</h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px'
            }}
          >
            &times;
          </button>
        </div>
        
        {loading && <p>{t('build_info_modal.loading')}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {buildInfo && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t('build_info_modal.name')}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{buildInfo.name}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t('build_info_modal.version')}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{buildInfo.version}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t('build_info_modal.build_time')}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{buildInfo.buildTime}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t('build_info_modal.git_commit')}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{buildInfo.git.commitShort}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t('build_info_modal.git_branch')}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{buildInfo.git.branch}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t('build_info_modal.node_version')}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{buildInfo.nodeVersion}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t('build_info_modal.platform')}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{buildInfo.platform}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{t('build_info_modal.architecture')}</td>
                  <td style={{ padding: '0.5rem' }}>{buildInfo.arch}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default BuildInfoModal

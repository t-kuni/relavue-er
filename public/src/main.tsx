import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import '../style.css'
import './i18n' // i18nextの初期化

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

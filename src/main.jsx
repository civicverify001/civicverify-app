import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
// Global styles
const style = document.createElement('style')
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  a { transition: opacity 0.15s; }
  a:hover { opacity: 0.85; }
  button { transition: all 0.15s; }
  button:hover { filter: brightness(1.05); }
  input:focus { border-color: #0B2545 !important; box-shadow: 0 0 0 3px rgba(11,37,69,0.08); }
  ::selection { background: rgba(197,150,12,0.2); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

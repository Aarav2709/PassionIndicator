import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { eraseAllData } from '@/lib/storage'

// one time wipe of local dev data from before the flight rework, safe to delete once it has run
const DEV_RESET_KEY = 'pi_dev_reset_2026_10_13'
const ready = import.meta.env.DEV && !localStorage.getItem(DEV_RESET_KEY)
  ? eraseAllData().then(() => localStorage.setItem(DEV_RESET_KEY, '1'))
  : Promise.resolve()

ready.then(() =>
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  ),
)

// lets the app be installed as a desktop window and open offline
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

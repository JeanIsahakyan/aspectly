import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WidgetApp } from './WidgetApp.tsx'
import { PopupApp } from './PopupApp.tsx'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')
const pathname = window.location.pathname

const getApp = () => {
  if (pathname === `${base}/widget` || pathname === `${base}/widget.html`) return <WidgetApp />
  if (pathname === `${base}/popup` || pathname === `${base}/popup.html`) return <PopupApp />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {getApp()}
  </StrictMode>,
)

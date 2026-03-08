import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WidgetApp } from './WidgetApp.tsx'
import { PopupApp } from './PopupApp.tsx'

const pathname = window.location.pathname

const getApp = () => {
  if (pathname === '/widget' || pathname === '/widget.html') return <WidgetApp />
  if (pathname === '/popup' || pathname === '/popup.html') return <PopupApp />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {getApp()}
  </StrictMode>,
)

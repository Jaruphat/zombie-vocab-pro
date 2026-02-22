import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Performance optimization for mobile
const optimizeForMobile = () => {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
  if (!isTouchDevice) return

  // Disable context menu on long press (mobile)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })
}

optimizeForMobile()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

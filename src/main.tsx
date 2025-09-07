import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Register service worker for PWA (disabled in dev mode)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Performance optimization for mobile
const optimizeForMobile = () => {
  // Disable context menu on long press (mobile)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })

  // Optimize scrolling
  document.addEventListener('touchstart', () => {}, { passive: true })
  document.addEventListener('touchmove', () => {}, { passive: true })
}

optimizeForMobile()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

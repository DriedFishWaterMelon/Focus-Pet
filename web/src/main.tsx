import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// The PWA service worker caches the app shell, which means a participant can
// keep running an old build long after a new one is deployed — during a
// four-week study that is how someone ends up stuck without a fix everyone
// else has. The worker is configured to take over as soon as it installs, so
// when it does, reload once to pick up the matching JavaScript.
if ('serviceWorker' in navigator) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

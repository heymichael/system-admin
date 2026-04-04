import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { AuthGate } from '@haderach/shared-ui'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate appPath="/admin/system/" appId="system_administration">
      <App />
    </AuthGate>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'
import { ConfirmProvider } from './components/Confirm'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Dialogs wrap the whole app, so even the launch logic in App can ask for a code. */}
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </StrictMode>,
)

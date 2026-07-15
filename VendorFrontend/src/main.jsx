import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import DesktopBlock from './buyerComponent/DesktopBlock.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DesktopBlock>
    <App />
    </DesktopBlock>
  </StrictMode>,
)

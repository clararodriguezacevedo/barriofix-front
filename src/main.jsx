import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { RequestsProvider } from './context/RequestsContext.jsx'
import { UserProvider } from './context/UserContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <RequestsProvider>
          <App />
        </RequestsProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>,
)

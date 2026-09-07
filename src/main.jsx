import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CatalogosProvider } from './context/CatalogosContext.jsx'
import { SolicitudesProvider } from './context/SolicitudesContext.jsx'

// Orden importante: Solicitudes depende de Auth (sin token no pide nada), y
// Catalogos es independiente porque sus endpoints son públicos.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CatalogosProvider>
          <SolicitudesProvider>
            <App />
          </SolicitudesProvider>
        </CatalogosProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

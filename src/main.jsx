import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { cargarConfig } from './config'
import { AuthProvider } from './context/AuthContext.jsx'
import { CatalogosProvider } from './context/CatalogosContext.jsx'
import { SolicitudesProvider } from './context/SolicitudesContext.jsx'

// Cargar la config (API URL, Cognito) ANTES de montar: la app la necesita para
// el primer fetch y para armar la URL de login.
cargarConfig().then(() => {
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
})

import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Auth from './pages/Auth'
import NewRequest from './pages/NewRequest'
import Jobs from './pages/Jobs'
import Tracking from './pages/Tracking'
import History from './pages/History'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ingreso" element={<Auth />} />

          <Route
            path="/nueva-solicitud"
            element={
              <ProtectedRoute rol="cliente">
                <NewRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trabajos"
            element={
              <ProtectedRoute rol="profesional">
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seguimiento"
            element={
              <ProtectedRoute>
                <Tracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>BarrioFix, red vecinal de reparaciones</span>
        <span>Ciudad de Buenos Aires y AMBA</span>
      </footer>
    </div>
  )
}

export default App

import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
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
          <Route path="/nueva-solicitud" element={<NewRequest />} />
          <Route path="/trabajos" element={<Jobs />} />
          <Route path="/seguimiento" element={<Tracking />} />
          <Route path="/historial" element={<History />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>BarrioFix · red vecinal de reparaciones</span>
        <span>Villa Alegre — datos de demostración</span>
      </footer>
    </div>
  )
}

export default App

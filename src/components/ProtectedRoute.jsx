import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Envuelve una ruta que requiere sesión. Con `rol` además exige el subtipo:
 * un vecino no debería poder entrar a la bandeja de trabajos y viceversa.
 */
export default function ProtectedRoute({ children, rol }) {
  const { autenticado, cargando, esCliente, esProfesional } = useAuth()
  const location = useLocation()

  // Mientras se valida el token guardado no decidimos nada: si redirigiéramos
  // acá, cada recarga de página mandaría al login por un instante.
  if (cargando) return <p className="empty-state">Verificando tu sesión…</p>

  if (!autenticado) {
    return <Navigate to="/ingreso" state={{ desde: location.pathname }} replace />
  }

  if (rol === 'cliente' && !esCliente) {
    return (
      <p className="empty-state">
        Esta sección es para vecinos. Tu cuenta está registrada solo como profesional.
      </p>
    )
  }

  if (rol === 'profesional' && !esProfesional) {
    return (
      <p className="empty-state">
        Esta sección es para profesionales. Podés darte de alta desde tu perfil.
      </p>
    )
  }

  return children
}

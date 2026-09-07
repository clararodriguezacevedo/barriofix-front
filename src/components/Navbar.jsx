import { NavLink, useNavigate } from 'react-router-dom'
import { IconWrench } from './Icons'
import { useAuth } from '../context/AuthContext'

// `rol` filtra qué links mostrar: no tiene sentido ofrecerle "Trabajos" a un
// vecino que no es profesional, la ruta lo rebotaría igual.
const LINKS = [
  { to: '/', label: 'Inicio', end: true, publico: true },
  { to: '/nueva-solicitud', label: 'Pedir arreglo', rol: 'cliente' },
  { to: '/trabajos', label: 'Trabajos', rol: 'profesional' },
  { to: '/seguimiento', label: 'Seguimiento' },
  { to: '/perfil', label: 'Perfil' },
]

export default function Navbar() {
  const { usuario, autenticado, esCliente, esProfesional, logout } = useAuth()
  const navigate = useNavigate()

  const visibles = LINKS.filter((l) => {
    if (l.publico) return true
    if (!autenticado) return false
    if (l.rol === 'cliente') return esCliente
    if (l.rol === 'profesional') return esProfesional
    return true
  })

  function salir() {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__mark">
            <IconWrench width={18} height={18} />
          </span>
          Barrio<em>Fix</em>
        </NavLink>

        <nav className="navbar__links">
          {visibles.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                'navbar__link' + (isActive ? ' navbar__link--active' : '')
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__user">
          {autenticado ? (
            <>
              <span className="navbar__hello">
                Hola, {usuario.nombre}
                <span className="navbar__role">
                  {' '}
                  ({[esCliente && 'vecino/a', esProfesional && 'profesional']
                    .filter(Boolean)
                    .join(' y ')})
                </span>
              </span>
              <button type="button" className="btn btn-ghost" onClick={salir}>
                Salir
              </button>
            </>
          ) : (
            <NavLink to="/ingreso" className="btn btn-outline btn-sm">
              Ingresar
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}

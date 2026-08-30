import { NavLink } from 'react-router-dom'
import { IconWrench } from './Icons'
import { useUser } from '../context/UserContext'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/nueva-solicitud', label: 'Pedir arreglo' },
  { to: '/trabajos', label: 'Trabajos' },
  { to: '/seguimiento', label: 'Seguimiento' },
  { to: '/historial', label: 'Historial' },
]

export default function Navbar() {
  const { user, logout } = useUser()

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
          {links.map((l) => (
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
          {user ? (
            <>
              <span className="navbar__hello">
                Hola, {user.name.split(' ')[0]} <span className="navbar__role">· {user.role}</span>
              </span>
              <button type="button" className="btn btn-ghost" onClick={logout}>
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

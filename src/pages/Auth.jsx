import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCatalogos } from '../context/CatalogosContext'
import { IconUser, IconBriefcase } from '../components/Icons'

const vacio = {
  username: '',
  password: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  descripcion_profesional: '',
}

export default function Auth() {
  const [modo, setModo] = useState('ingreso')
  const [form, setForm] = useState(vacio)
  // Un usuario es CLIENTE o PROFESIONAL, no las dos cosas. Por defecto CLIENTE.
  const [rol, setRol] = useState('CLIENTE')
  const [categorias, setCategorias] = useState([])
  const esProfesional = rol === 'PROFESIONAL'
  const esCliente = rol === 'CLIENTE'
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { login, registro } = useAuth()
  const { categorias: todasLasCategorias } = useCatalogos()
  const navigate = useNavigate()
  const location = useLocation()

  function actualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function toggleCategoria(id) {
    setCategorias((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  function destino(usuario) {
    // Si venía de una ruta protegida, lo devolvemos ahí.
    if (location.state?.desde) return location.state.desde
    return usuario.es_profesional && !usuario.es_cliente ? '/trabajos' : '/nueva-solicitud'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (modo === 'ingreso') {
      if (!form.username || !form.password) {
        setError('Completá usuario y contraseña.')
        return
      }
    } else {
      if (!form.username || !form.password || !form.nombre || !form.apellido || !form.email) {
        setError('Completá todos los campos obligatorios.')
        return
      }
      if (form.password.length < 8) {
        setError('La contraseña necesita al menos 8 caracteres.')
        return
      }
      if (esProfesional && categorias.length === 0) {
        setError('Elegí al menos una especialidad para tu perfil profesional.')
        return
      }
    }

    setEnviando(true)
    try {
      const usuario =
        modo === 'ingreso'
          ? await login(form.username, form.password)
          : await registro({
              username: form.username,
              password: form.password,
              nombre: form.nombre,
              apellido: form.apellido,
              email: form.email,
              telefono: form.telefono || null,
              rol,
              descripcion_profesional: esProfesional
                ? form.descripcion_profesional || null
                : null,
              categorias: esProfesional ? categorias : [],
            })
      navigate(destino(usuario), { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const esRegistro = modo === 'registro'

  return (
    <div className="page page--auth">
      <div className="auth-card ticket">
        <div className="auth-tabs">
          <button
            type="button"
            className={'auth-tabs__btn' + (!esRegistro ? ' is-active' : '')}
            onClick={() => {
              setModo('ingreso')
              setError('')
            }}
          >
            Ingresar
          </button>
          <button
            type="button"
            className={'auth-tabs__btn' + (esRegistro ? ' is-active' : '')}
            onClick={() => {
              setModo('registro')
              setError('')
            }}
          >
            Registrarme
          </button>
        </div>

        <h1 className="auth-card__title">
          {esRegistro ? 'Sumate a BarrioFix' : 'Bienvenido de nuevo'}
        </h1>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Usuario</span>
            <input
              value={form.username}
              onChange={(e) => actualizar('username', e.target.value)}
              placeholder="anagomez"
              autoComplete="username"
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => actualizar('password', e.target.value)}
              placeholder="••••••••"
              autoComplete={esRegistro ? 'new-password' : 'current-password'}
            />
            {esRegistro && (
              <small style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                Mínimo 8 caracteres.
              </small>
            )}
          </label>

          {esRegistro && (
            <>
              <div className="field-row">
                <label className="field">
                  <span>Nombre</span>
                  <input
                    value={form.nombre}
                    onChange={(e) => actualizar('nombre', e.target.value)}
                    placeholder="Ana"
                  />
                </label>
                <label className="field">
                  <span>Apellido</span>
                  <input
                    value={form.apellido}
                    onChange={(e) => actualizar('apellido', e.target.value)}
                    placeholder="Gómez"
                  />
                </label>
              </div>

              <div className="field-row">
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => actualizar('email', e.target.value)}
                    placeholder="vos@ejemplo.com"
                  />
                </label>
                <label className="field">
                  <span>Teléfono (opcional)</span>
                  <input
                    value={form.telefono}
                    onChange={(e) => actualizar('telefono', e.target.value)}
                    placeholder="11 5555 5555"
                  />
                </label>
              </div>

              <div className="field">
                <span>¿Cómo vas a usar BarrioFix?</span>
                <div className="chip-row" role="radiogroup" aria-label="Rol">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={esCliente}
                    className={'chip' + (esCliente ? ' chip--active' : '')}
                    onClick={() => setRol('CLIENTE')}
                  >
                    <IconUser width={16} height={16} /> Vecino/a
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={esProfesional}
                    className={'chip' + (esProfesional ? ' chip--active' : '')}
                    onClick={() => setRol('PROFESIONAL')}
                  >
                    <IconBriefcase width={16} height={16} /> Profesional
                  </button>
                </div>
              </div>

              {esProfesional && (
                <>
                  <label className="field">
                    <span>Contanos de tu oficio (opcional)</span>
                    <textarea
                      rows={2}
                      value={form.descripcion_profesional}
                      onChange={(e) => actualizar('descripcion_profesional', e.target.value)}
                      placeholder="15 años de experiencia en instalaciones domiciliarias."
                    />
                  </label>

                  <div className="field">
                    <span>Tus especialidades</span>
                    <div className="chip-row">
                      {todasLasCategorias.map((c) => (
                        <button
                          key={c.id_categoria}
                          type="button"
                          className={
                            'chip' + (categorias.includes(c.id_categoria) ? ' chip--active' : '')
                          }
                          onClick={() => toggleCategoria(c.id_categoria)}
                        >
                          {c.nombre}
                        </button>
                      ))}
                    </div>
                    <small className="auth-card__hint">
                      Solo vas a ver trabajos de las categorías que elijas.
                    </small>
                  </div>
                </>
              )}
            </>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
            {enviando ? 'Enviando…' : esRegistro ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

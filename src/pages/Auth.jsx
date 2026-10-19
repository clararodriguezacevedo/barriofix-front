import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCatalogos } from '../context/CatalogosContext'
import { IconUser, IconBriefcase } from '../components/Icons'

export default function Auth() {
  const { autenticado, necesitaPerfil, login, registro } = useAuth()
  const { categorias: todasLasCategorias } = useCatalogos()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', descripcion_profesional: '' })
  const [rol, setRol] = useState('CLIENTE')
  const [categorias, setCategorias] = useState([])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const esProfesional = rol === 'PROFESIONAL'

  function actualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }
  function toggleCategoria(id) {
    setCategorias((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  async function completarPerfil(e) {
    e.preventDefault()
    setError('')
    if (!form.nombre || !form.apellido) {
      setError('Completá nombre y apellido.')
      return
    }
    if (esProfesional && categorias.length === 0) {
      setError('Elegí al menos una especialidad.')
      return
    }
    setEnviando(true)
    try {
      const usuario = await registro({
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono || null,
        rol,
        descripcion_profesional: esProfesional ? form.descripcion_profesional || null : null,
        categorias: esProfesional ? categorias : [],
      })
      const desde = location.state?.desde
      navigate(desde || (usuario.es_profesional ? '/trabajos' : '/nueva-solicitud'), { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  // Caso 1: autenticado en Cognito pero sin perfil -> completar registro.
  if (necesitaPerfil) {
    return (
      <div className="page page--auth">
        <div className="auth-card ticket">
          <h1 className="auth-card__title">Completá tu perfil</h1>
          <p className="page__lead">Tu cuenta ya está creada. Contanos quién sos para terminar.</p>

          <form className="form" onSubmit={completarPerfil}>
            <div className="field-row">
              <label className="field">
                <span>Nombre</span>
                <input value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} placeholder="Ana" />
              </label>
              <label className="field">
                <span>Apellido</span>
                <input value={form.apellido} onChange={(e) => actualizar('apellido', e.target.value)} placeholder="Gómez" />
              </label>
            </div>

            <label className="field">
              <span>Teléfono (opcional)</span>
              <input value={form.telefono} onChange={(e) => actualizar('telefono', e.target.value)} placeholder="11 5555 5555" />
            </label>

            <div className="field">
              <span>¿Cómo vas a usar BarrioFix?</span>
              <div className="chip-row" role="radiogroup" aria-label="Rol">
                <button type="button" role="radio" aria-checked={!esProfesional}
                  className={'chip' + (!esProfesional ? ' chip--active' : '')} onClick={() => setRol('CLIENTE')}>
                  <IconUser width={16} height={16} /> Vecino/a
                </button>
                <button type="button" role="radio" aria-checked={esProfesional}
                  className={'chip' + (esProfesional ? ' chip--active' : '')} onClick={() => setRol('PROFESIONAL')}>
                  <IconBriefcase width={16} height={16} /> Profesional
                </button>
              </div>
            </div>

            {esProfesional && (
              <>
                <label className="field">
                  <span>Contanos de tu oficio (opcional)</span>
                  <textarea rows={2} value={form.descripcion_profesional}
                    onChange={(e) => actualizar('descripcion_profesional', e.target.value)}
                    placeholder="15 años en instalaciones domiciliarias." />
                </label>
                <div className="field">
                  <span>Tus especialidades</span>
                  <div className="chip-row">
                    {todasLasCategorias.map((c) => (
                      <button key={c.id_categoria} type="button"
                        className={'chip' + (categorias.includes(c.id_categoria) ? ' chip--active' : '')}
                        onClick={() => toggleCategoria(c.id_categoria)}>
                        {c.nombre}
                      </button>
                    ))}
                  </div>
                  <small className="auth-card__hint">Solo vas a ver trabajos de las categorías que elijas.</small>
                </div>
              </>
            )}

            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Completar registro'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Caso 2: ya autenticado y con perfil -> nada que hacer acá.
  if (autenticado) {
    navigate('/', { replace: true })
    return null
  }

  // Caso 3: sin sesión -> botón a la Hosted UI (login y registro en un solo lugar).
  return (
    <div className="page page--auth">
      <div className="auth-card ticket">
        <h1 className="auth-card__title">Ingresá a BarrioFix</h1>
        <p className="page__lead">
          Usá tu cuenta para pedir un arreglo o tomar trabajos. Si es tu primera vez, en la misma
          pantalla podés registrarte.
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={login}>
          Ingresar o registrarme
        </button>
      </div>
    </div>
  )
}

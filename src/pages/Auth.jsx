import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { IconUser, IconBriefcase } from '../components/Icons'

export default function Auth() {
  const [mode, setMode] = useState('ingreso')
  const [role, setRole] = useState('Vecino/a')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { setUser } = useUser()
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password || (mode === 'registro' && !name)) {
      setError('Completá todos los campos para continuar.')
      return
    }
    setError('')
    setUser({ name: mode === 'registro' ? name : email.split('@')[0], email, role })
    navigate(role === 'Profesional' ? '/trabajos' : '/nueva-solicitud')
  }

  return (
    <div className="page page--auth">
      <div className="auth-card ticket">
        <div className="auth-tabs">
          <button
            type="button"
            className={'auth-tabs__btn' + (mode === 'ingreso' ? ' is-active' : '')}
            onClick={() => setMode('ingreso')}
          >
            Ingresar
          </button>
          <button
            type="button"
            className={'auth-tabs__btn' + (mode === 'registro' ? ' is-active' : '')}
            onClick={() => setMode('registro')}
          >
            Registrarme
          </button>
        </div>

        <h1 className="auth-card__title">
          {mode === 'ingreso' ? 'Bienvenido de nuevo' : 'Sumate a BarrioFix'}
        </h1>

        <div className="role-toggle" role="group" aria-label="Elegí tu rol">
          <button
            type="button"
            className={'chip' + (role === 'Vecino/a' ? ' chip--active' : '')}
            onClick={() => setRole('Vecino/a')}
          >
            <IconUser width={16} height={16} /> Vecino/a
          </button>
          <button
            type="button"
            className={'chip' + (role === 'Profesional' ? ' chip--active' : '')}
            onClick={() => setRole('Profesional')}
          >
            <IconBriefcase width={16} height={16} /> Profesional
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          {mode === 'registro' && (
            <label className="field">
              <span>Nombre y apellido</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Gómez" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@ejemplo.com"
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block">
            {mode === 'ingreso' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-card__hint">
          Esta es una demo con datos simulados: no se envía nada a un servidor todavía.
        </p>
      </div>
    </div>
  )
}

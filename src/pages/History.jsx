import { useMemo, useState } from 'react'
import { useSolicitudes } from '../context/SolicitudesContext'
import { useAuth } from '../context/AuthContext'
import { ESTADOS } from '../data/estados'
import StatusBadge from '../components/StatusBadge'
import ApiState from '../components/ApiState'
import { IconStar, IconMapPin, IconUser } from '../components/Icons'

function nombreCompleto(p) {
  return p ? `${p.nombre} ${p.apellido}` : null
}

function RatingStars({ value, onChange, readOnly }) {
  return (
    <div className="rating-stars" role="radiogroup" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="rating-stars__btn"
          aria-checked={value === n}
          role="radio"
          disabled={readOnly}
          onClick={() => !readOnly && onChange(n)}
        >
          <IconStar filled={n <= value} width={20} height={20} />
        </button>
      ))}
    </div>
  )
}

function HistoryTicket({ solicitud, onCalificar, puedeCalificar }) {
  const [puntuacion, setPuntuacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    setEnviando(true)
    setError(null)
    try {
      await onCalificar(solicitud.id_solicitud, puntuacion, comentario)
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const yaCalificada = Boolean(solicitud.calificacion)

  return (
    <article className="ticket">
      <div className="ticket__top">
        <StatusBadge estado={solicitud.estado} />
      </div>
      <h3 className="ticket__title">{solicitud.titulo}</h3>
      <div className="chip-row">
        <span className="chip">{solicitud.categoria?.nombre}</span>
        <span className="chip">{solicitud.zona?.nombre}</span>
      </div>

      <ul className="ticket__meta">
        <li>
          <IconMapPin width={16} height={16} /> {solicitud.direccion}
        </li>
        <li>
          <IconUser width={16} height={16} />{' '}
          {nombreCompleto(solicitud.profesional) ?? 'sin profesional registrado'}
        </li>
      </ul>

      {yaCalificada ? (
        <div className="ticket__rating">
          <RatingStars value={solicitud.calificacion.puntuacion} readOnly onChange={() => {}} />
          {solicitud.calificacion.comentario && (
            <p className="ticket__comment">“{solicitud.calificacion.comentario}”</p>
          )}
        </div>
      ) : puedeCalificar ? (
        <div className="ticket__rating ticket__rating--form">
          <RatingStars value={puntuacion} onChange={setPuntuacion} />
          <textarea
            rows={2}
            placeholder="Contá cómo te fue con el trabajo (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          {error && <p className="form-error">{error}</p>}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={puntuacion === 0 || enviando}
            onClick={enviar}
          >
            {enviando ? 'Enviando…' : 'Calificar'}
          </button>
        </div>
      ) : (
        <p className="empty-state empty-state--inline">Sin calificar.</p>
      )}
    </article>
  )
}

export default function History() {
  const { solicitudes, calificar, cargando, error } = useSolicitudes()
  const { usuario } = useAuth()

  // Solo los trabajos terminados: cancelados no se califican.
  const resueltas = useMemo(
    () => solicitudes.filter((s) => s.estado?.nombre === ESTADOS.RESUELTO),
    [solicitudes],
  )

  const promedio = useMemo(() => {
    const calificadas = resueltas.filter((s) => s.calificacion)
    if (calificadas.length === 0) return null
    const suma = calificadas.reduce((acc, s) => acc + s.calificacion.puntuacion, 0)
    return (suma / calificadas.length).toFixed(1)
  }, [resueltas])

  const soloProfesional = usuario?.es_profesional && !usuario?.es_cliente
  const soloCliente = usuario?.es_cliente && !usuario?.es_profesional

  // Titulo y lead por rol para no mezclar dos audiencias en un mismo texto.
  const pageTitle = soloProfesional
    ? 'Mi historial de trabajos'
    : soloCliente
      ? 'Mis solicitudes resueltas'
      : 'Mi perfil'
  const pageLead = soloProfesional
    ? 'Trabajos que completaste. Tu calificación promedio se acumula acá.'
    : soloCliente
      ? 'Solicitudes que ya se resolvieron. Podés calificar las que todavía no calificaste.'
      : 'Trabajos que resolviste como profesional y solicitudes que se resolvieron para vos.'

  return (
    <div className="page">
      <div className="page__header-row">
        <div>
          <h1 className="page__title">{pageTitle}</h1>
          <p className="page__lead">{pageLead}</p>
        </div>
        {promedio && (
          <div className="avg-badge">
            <IconStar filled width={18} height={18} />
            <span>{promedio}</span>
            <small>promedio</small>
          </div>
        )}
      </div>

      <ApiState loading={cargando} error={error} loadingText="Cargando historial…" />

      {!cargando && !error && resueltas.length === 0 && (
        <p className="empty-state">Todavía no hay trabajos resueltos.</p>
      )}

      {!cargando && !error && resueltas.length > 0 && (
        <div className="ticket-grid">
          {resueltas.map((s) => (
            <HistoryTicket
              key={s.id_solicitud}
              solicitud={s}
              onCalificar={calificar}
              // El backend solo deja calificar al cliente dueño de la solicitud.
              puedeCalificar={s.cliente?.id_usuario === usuario?.id_usuario}
            />
          ))}
        </div>
      )}
    </div>
  )
}

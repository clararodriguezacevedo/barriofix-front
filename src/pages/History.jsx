import { useMemo, useState } from 'react'
import { useRequests } from '../context/RequestsContext'
import { STATUS } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import { IconStar, IconMapPin, IconUser } from '../components/Icons'

function RatingStars({ value, onChange }) {
  return (
    <div className="rating-stars" role="radiogroup" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="rating-stars__btn"
          aria-checked={value === n}
          role="radio"
          onClick={() => onChange(n)}
        >
          <IconStar filled={n <= value} width={20} height={20} />
        </button>
      ))}
    </div>
  )
}

function HistoryTicket({ request, onRate }) {
  const [draft, setDraft] = useState(0)
  const [comentario, setComentario] = useState('')

  return (
    <article className="ticket">
      <div className="ticket__top">
        <span className="ticket__id">{request.id}</span>
        <StatusBadge estado={request.estado} />
      </div>
      <h3 className="ticket__title">{request.titulo}</h3>
      <span className="ticket__category">{request.categoria}</span>

      <ul className="ticket__meta">
        <li>
          <IconMapPin width={16} height={16} /> {request.direccion}
        </li>
        <li>
          <IconUser width={16} height={16} /> {request.profesional ?? 'sin profesional registrado'}
        </li>
      </ul>

      {request.rating ? (
        <div className="ticket__rating">
          <RatingStars value={request.rating} onChange={() => {}} />
          {request.comentario && <p className="ticket__comment">“{request.comentario}”</p>}
        </div>
      ) : (
        <div className="ticket__rating ticket__rating--form">
          <RatingStars value={draft} onChange={setDraft} />
          <textarea
            rows={2}
            placeholder="Contá cómo te fue con el trabajo (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={draft === 0}
            onClick={() => onRate(request.id, draft, comentario)}
          >
            Calificar
          </button>
        </div>
      )}
    </article>
  )
}

export default function History() {
  const { requests, rateRequest } = useRequests()

  const completados = useMemo(
    () => requests.filter((r) => r.estado === STATUS.COMPLETADO),
    [requests],
  )

  const promedio = useMemo(() => {
    const calificados = completados.filter((r) => r.rating)
    if (calificados.length === 0) return null
    return (calificados.reduce((acc, r) => acc + r.rating, 0) / calificados.length).toFixed(1)
  }, [completados])

  return (
    <div className="page">
      <div className="page__header-row">
        <div>
          <h1 className="page__title">Historial y calificaciones</h1>
          <p className="page__lead">Trabajos ya resueltos en el barrio.</p>
        </div>
        {promedio && (
          <div className="avg-badge">
            <IconStar filled width={18} height={18} />
            <span>{promedio}</span>
            <small>promedio</small>
          </div>
        )}
      </div>

      {completados.length === 0 ? (
        <p className="empty-state">Todavía no hay trabajos completados.</p>
      ) : (
        <div className="ticket-grid">
          {completados.map((r) => (
            <HistoryTicket key={r.id} request={r} onRate={rateRequest} />
          ))}
        </div>
      )}
    </div>
  )
}

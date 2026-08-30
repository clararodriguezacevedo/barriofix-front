import StatusBadge from './StatusBadge'
import { IconMapPin, IconUser, IconClock } from './Icons'

export default function RequestTicket({ request, footer }) {
  return (
    <article className="ticket">
      <div className="ticket__top">
        <span className="ticket__id">{request.id}</span>
        <StatusBadge estado={request.estado} />
      </div>

      <h3 className="ticket__title">{request.titulo}</h3>
      <span className="ticket__category">{request.categoria}</span>

      <p className="ticket__desc">{request.descripcion}</p>

      <ul className="ticket__meta">
        <li>
          <IconMapPin width={16} height={16} /> {request.direccion}
        </li>
        <li>
          <IconUser width={16} height={16} /> {request.cliente}
          {request.profesional ? ` → ${request.profesional}` : ''}
        </li>
        <li>
          <IconClock width={16} height={16} /> {request.creado} · urgencia {request.urgencia.toLowerCase()}
        </li>
      </ul>

      {footer && <div className="ticket__footer">{footer}</div>}
    </article>
  )
}

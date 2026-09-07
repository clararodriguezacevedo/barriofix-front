import StatusBadge from './StatusBadge'
import UrgenciaBadge from './UrgenciaBadge'

/**
 * Card compacta para el tablero de trabajos disponibles. Muestra lo minimo
 * para decidir si abrir la vista completa: quien pidio, que categoria, en que
 * zona y con que urgencia. El detalle (direccion, descripcion completa,
 * fotos) vive en el modal que abre `footer`.
 */
export default function RequestTicket({ solicitud, footer }) {
  return (
    <article className="ticket">
      <div className="ticket__top">
        <span className="ticket__id">#{solicitud.id_solicitud}</span>
        <StatusBadge estado={solicitud.estado} />
      </div>

      <h3 className="ticket__title">{solicitud.titulo}</h3>

      <div className="chip-row">
        <span className="chip">{solicitud.categoria?.nombre}</span>
        <span className="chip">{solicitud.zona?.nombre}</span>
        <UrgenciaBadge urgencia={solicitud.urgencia} />
      </div>

      {footer && <div className="ticket__footer">{footer}</div>}
    </article>
  )
}

import { useEffect, useState } from 'react'
import { useRequests } from '../context/RequestsContext'
import { STATUS, STATUS_STEPS, STATUS_LABEL } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import ApiState from '../components/ApiState'
import { IconMapPin, IconUser } from '../components/Icons'

export default function Tracking() {
  const { requests, completeJob, loading, error } = useRequests()
  const [selectedId, setSelectedId] = useState(requests[0]?.id ?? null)

  useEffect(() => {
    if (!requests.some((r) => r.id === selectedId)) {
      setSelectedId(requests[0]?.id ?? null)
    }
  }, [requests, selectedId])

  const selected = requests.find((r) => r.id === selectedId)
  const currentStepIndex = selected ? STATUS_STEPS.indexOf(selected.estado) : -1

  return (
    <div className="page page--tracking">
      <h1 className="page__title">Seguimiento de solicitudes</h1>
      <p className="page__lead">Elegí un ticket para ver en qué etapa está.</p>

      <ApiState loading={loading} error={error} loadingText="Cargando solicitudes…" />

      {!loading && !error && (
      <div className="tracking-layout">
        <ul className="tracking-list">
          {requests.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={'tracking-list__item' + (r.id === selectedId ? ' is-selected' : '')}
                onClick={() => setSelectedId(r.id)}
              >
                <span className="tracking-list__id">{r.id}</span>
                <span className="tracking-list__title">{r.titulo}</span>
                <StatusBadge estado={r.estado} />
              </button>
            </li>
          ))}
        </ul>

        {selected && (
          <div className="ticket tracking-detail">
            <div className="ticket__top">
              <span className="ticket__id">{selected.id}</span>
              <StatusBadge estado={selected.estado} />
            </div>
            <h2 className="ticket__title">{selected.titulo}</h2>

            <ol className="stepper">
              {STATUS_STEPS.map((step, i) => (
                <li
                  key={step}
                  className={
                    'stepper__step' +
                    (i < currentStepIndex ? ' is-done' : '') +
                    (i === currentStepIndex ? ' is-current' : '')
                  }
                >
                  <span className="stepper__dot" />
                  <span className="stepper__label">{STATUS_LABEL[step]}</span>
                </li>
              ))}
            </ol>

            <ul className="ticket__meta">
              <li>
                <IconMapPin width={16} height={16} /> {selected.direccion}
              </li>
              <li>
                <IconUser width={16} height={16} /> {selected.cliente}
                {selected.profesional ? ` → asignado a ${selected.profesional}` : ' → sin profesional asignado aún'}
              </li>
            </ul>

            <p className="ticket__desc">{selected.descripcion}</p>

            {selected.estado === STATUS.EN_PROGRESO && (
              <button type="button" className="btn btn-primary" onClick={() => completeJob(selected.id)}>
                Marcar como completado
              </button>
            )}
            {selected.estado === STATUS.PENDIENTE && (
              <p className="empty-state empty-state--inline">
                Todavía nadie tomó este trabajo. Se va a ver en la lista de trabajos disponibles.
              </p>
            )}
            {selected.estado === STATUS.COMPLETADO && (
              <p className="empty-state empty-state--inline">
                Trabajo completado{selected.rating ? `, calificado con ${selected.rating}/5.` : '. Todavía sin calificar.'}
              </p>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  )
}

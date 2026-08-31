import { useMemo, useState } from 'react'
import { useRequests } from '../context/RequestsContext'
import { useUser } from '../context/UserContext'
import { CATEGORIES, STATUS } from '../data/mockData'
import RequestTicket from '../components/RequestTicket'
import ApiState from '../components/ApiState'

export default function Jobs() {
  const { requests, takeJob, loading, error } = useRequests()
  const { user } = useUser()
  const [filtro, setFiltro] = useState('Todas')

  const disponibles = useMemo(
    () =>
      requests
        .filter((r) => r.estado === STATUS.PENDIENTE)
        .filter((r) => filtro === 'Todas' || r.categoria === filtro),
    [requests, filtro],
  )

  const nombreProfesional = user?.name ?? 'Profesional invitado'

  return (
    <div className="page">
      <h1 className="page__title">Trabajos disponibles</h1>
      <p className="page__lead">
        Estos son los pedidos que todavía no tienen profesional asignado en Villa Alegre.
      </p>

      <div className="chip-row chip-row--filters">
        <button
          type="button"
          className={'chip' + (filtro === 'Todas' ? ' chip--active' : '')}
          onClick={() => setFiltro('Todas')}
        >
          Todas
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={'chip' + (filtro === c ? ' chip--active' : '')}
            onClick={() => setFiltro(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <ApiState loading={loading} error={error} loadingText="Cargando trabajos…" />

      {!loading && !error && disponibles.length === 0 && (
        <p className="empty-state">No hay trabajos disponibles en esta categoría por ahora.</p>
      )}

      {!loading && !error && disponibles.length > 0 && (
        <div className="ticket-grid">
          {disponibles.map((r) => (
            <RequestTicket
              key={r.id}
              request={r}
              footer={
                <button type="button" className="btn btn-primary btn-sm" onClick={() => takeJob(r.id, nombreProfesional)}>
                  Tomar trabajo
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

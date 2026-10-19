import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTrabajos } from '../api/client'
import { useSolicitudes } from '../context/SolicitudesContext'
import { useCatalogos } from '../context/CatalogosContext'
import RequestTicket from '../components/RequestTicket'
import UrgenciaBadge from '../components/UrgenciaBadge'
import Modal from '../components/Modal'
import ApiState from '../components/ApiState'
import { IconMapPin, IconUser } from '../components/Icons'

function nombreCompleto(p) {
  return p ? `${p.nombre} ${p.apellido}` : null
}

function DetalleTrabajo({ solicitud, tomando, onTomar, onClose }) {
  if (!solicitud) return null
  return (
    <>
      <div className="chip-row">
        <span className="chip">{solicitud.categoria?.nombre}</span>
        <span className="chip">{solicitud.zona?.nombre}</span>
        <UrgenciaBadge urgencia={solicitud.urgencia} />
      </div>

      <ul className="ticket__meta">
        <li>
          <IconMapPin width={16} height={16} /> {solicitud.direccion}
        </li>
        <li>
          <IconUser width={16} height={16} /> {nombreCompleto(solicitud.cliente)}
        </li>
      </ul>

      <p className="ticket__desc">{solicitud.descripcion}</p>

      {solicitud.fotos?.length > 0 && (
        <div className="media-grid">
          {solicitud.fotos.map((f) => (
            <a
              key={f.id_foto}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="media-item"
            >
              <img src={f.url} alt={f.nombre_archivo} loading="lazy" />
              <span className="media-item__key">
                {f.tipo_foto === 'ANTES' ? 'Antes del arreglo' : 'Después del arreglo'}
              </span>
            </a>
          ))}
        </div>
      )}

      <div className="dialog-body__actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          Cerrar
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={tomando}
          onClick={onTomar}
        >
          {tomando ? 'Tomando…' : 'Tomar trabajo'}
        </button>
      </div>
    </>
  )
}

export default function Jobs() {
  const { aceptar } = useSolicitudes()
  const { zonas, urgencias } = useCatalogos()
  const navigate = useNavigate()

  const [trabajos, setTrabajos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [idZona, setIdZona] = useState('')
  const [idUrgencia, setIdUrgencia] = useState('')
  const [todasLasCategorias, setTodasLasCategorias] = useState(false)
  const [seleccionada, setSeleccionada] = useState(null)
  const [tomando, setTomando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const { items } = await fetchTrabajos({
        id_zona: idZona || undefined,
        id_urgencia: idUrgencia || undefined,
        todas_las_categorias: todasLasCategorias || undefined,
      })
      setTrabajos(items)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [idZona, idUrgencia, todasLasCategorias])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function tomar() {
    if (!seleccionada) return
    setTomando(true)
    try {
      await aceptar(seleccionada.id_solicitud)
      setTrabajos((prev) => prev.filter((t) => t.id_solicitud !== seleccionada.id_solicitud))
      setSeleccionada(null)
      // Cuando la toma, el flujo natural es seguirlo en Seguimiento.
      navigate('/seguimiento')
    } catch (e) {
      setError(e.message)
      cargar()
    } finally {
      setTomando(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page__title">Trabajos disponibles</h1>
      <p className="page__lead">
        Solicitudes pendientes que coinciden con tus especialidades. Tocá una card para ver el
        detalle y decidir si la tomás.
      </p>

      <div className="chip-row chip-row--filters">
        <button
          type="button"
          className={'chip' + (!todasLasCategorias ? ' chip--active' : '')}
          onClick={() => setTodasLasCategorias(false)}
        >
          Mis especialidades
        </button>
        <button
          type="button"
          className={'chip' + (todasLasCategorias ? ' chip--active' : '')}
          onClick={() => setTodasLasCategorias(true)}
        >
          Todas las categorías
        </button>
      </div>

      <div className="ticket">
        <div className="field-row">
          <label className="field">
            <span>Zona</span>
            <select value={idZona} onChange={(e) => setIdZona(e.target.value)}>
              <option value="">Todas</option>
              {zonas.map((z) => (
                <option key={z.id_zona} value={z.id_zona}>
                  {z.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Urgencia</span>
            <select value={idUrgencia} onChange={(e) => setIdUrgencia(e.target.value)}>
              <option value="">Todas</option>
              {urgencias.map((u) => (
                <option key={u.id_urgencia} value={u.id_urgencia}>
                  {u.nombre.charAt(0) + u.nombre.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <ApiState loading={cargando} error={error} loadingText="Cargando trabajos…" />

        {!cargando && trabajos.length === 0 && !error && (
          <p className="empty-state">
            No hay trabajos disponibles con estos filtros. Probá con “Todas las categorías”.
          </p>
        )}

        {trabajos.length > 0 && (
          <div className="ticket-grid">
            {trabajos.map((s) => (
              <RequestTicket
                key={s.id_solicitud}
                solicitud={s}
                footer={
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setSeleccionada(s)}
                  >
                    Ver detalles
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={seleccionada !== null}
        onClose={() => setSeleccionada(null)}
        title={seleccionada?.titulo}
      >
        <DetalleTrabajo
          solicitud={seleccionada}
          tomando={tomando}
          onTomar={tomar}
          onClose={() => setSeleccionada(null)}
        />
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequests } from '../context/RequestsContext'
import { useUser } from '../context/UserContext'
import { CATEGORIES, URGENCIAS } from '../data/mockData'
import { IconCheck } from '../components/Icons'

const initialForm = {
  titulo: '',
  categoria: CATEGORIES[0],
  direccion: '',
  descripcion: '',
  urgencia: 'Media',
}

export default function NewRequest() {
  const { addRequest } = useRequests()
  const { user } = useUser()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [ticketId, setTicketId] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo || !form.direccion || !form.descripcion) return
    setSending(true)
    setError(null)
    try {
      const id = await addRequest({ ...form, cliente: user?.name ?? 'Vecino/a sin identificar' })
      setTicketId(id)
      setForm(initialForm)
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  if (ticketId) {
    return (
      <div className="page page--narrow">
        <div className="ticket confirm-ticket">
          <span className="confirm-ticket__icon">
            <IconCheck width={28} height={28} />
          </span>
          <h1>¡Listo, quedó cargada!</h1>
          <p>
            Tu solicitud <strong>{ticketId}</strong> ya está publicada como pendiente para que un
            profesional del barrio la tome.
          </p>
          <div className="confirm-ticket__actions">
            <button type="button" className="btn btn-outline" onClick={() => setTicketId(null)}>
              Cargar otra
            </button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/seguimiento')}>
              Ver seguimiento
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page page--narrow">
      <h1 className="page__title">Contanos qué se rompió</h1>
      <p className="page__lead">
        Cuanto más detalle des, más rápido un profesional va a poder tomar el trabajo.
      </p>

      <form className="form ticket" onSubmit={handleSubmit}>
        <label className="field">
          <span>Título del problema</span>
          <input
            value={form.titulo}
            onChange={(e) => update('titulo', e.target.value)}
            placeholder="Ej: pérdida de agua en el baño"
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Categoría</span>
            <select value={form.categoria} onChange={(e) => update('categoria', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Dirección</span>
            <input
              value={form.direccion}
              onChange={(e) => update('direccion', e.target.value)}
              placeholder="Calle, número, barrio"
            />
          </label>
        </div>

        <label className="field">
          <span>Descripción</span>
          <textarea
            rows={4}
            value={form.descripcion}
            onChange={(e) => update('descripcion', e.target.value)}
            placeholder="Contanos desde cuándo pasa, qué probaste, y cualquier detalle útil."
          />
        </label>

        <div className="field">
          <span>Urgencia</span>
          <div className="chip-row">
            {URGENCIAS.map((u) => (
              <button
                key={u}
                type="button"
                className={'chip' + (form.urgencia === u ? ' chip--active' : '')}
                onClick={() => update('urgencia', u)}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="form-error">No se pudo publicar: {error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
          {sending ? 'Publicando…' : 'Publicar solicitud'}
        </button>
      </form>
    </div>
  )
}

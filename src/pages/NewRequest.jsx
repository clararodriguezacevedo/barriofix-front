import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSolicitudes } from '../context/SolicitudesContext'
import { useCatalogos } from '../context/CatalogosContext'
import { subirFoto } from '../api/client'
import { IconCheck } from '../components/Icons'
import ApiState from '../components/ApiState'

export default function NewRequest() {
  const { crear } = useSolicitudes()
  const { categorias, zonas, urgencias, cargando, error: errorCatalogos } = useCatalogos()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    direccion: '',
    id_categoria: '',
    id_zona: '',
    id_urgencia: '',
  })
  const [fotos, setFotos] = useState([])
  const [creada, setCreada] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const fotoInputRef = useRef(null)

  // Categoría y zona arrancan vacías (las elige el usuario): evitamos
  // pre-seleccionar la primera alfabética y que se mande sin querer. La urgencia
  // sí lleva un default razonable (la del medio), que se ve como chip activo.
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      id_urgencia:
        prev.id_urgencia ||
        urgencias[Math.floor(urgencias.length / 2)]?.id_urgencia ||
        '',
    }))
  }, [urgencias])

  function actualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.titulo || !form.direccion || !form.descripcion) {
      setError('Completá título, dirección y descripción.')
      return
    }
    if (!form.id_categoria || !form.id_zona || !form.id_urgencia) {
      setError('Elegí categoría, zona y urgencia.')
      return
    }

    setEnviando(true)
    try {
      const solicitud = await crear({
        titulo: form.titulo,
        descripcion: form.descripcion,
        direccion: form.direccion,
        id_categoria: Number(form.id_categoria),
        id_zona: Number(form.id_zona),
        id_urgencia: Number(form.id_urgencia),
      })

      // Las fotos van después: la solicitud tiene que existir para poder
      // colgarles el id_solicitud y armar la key de S3.
      for (const archivo of fotos) {
        await subirFoto(solicitud.id_solicitud, archivo)
      }

      setCreada(solicitud)
      setFotos([])
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (creada) {
    return (
      <div className="page page--narrow">
        <div className="ticket confirm-ticket">
          <span className="confirm-ticket__icon">
            <IconCheck width={28} height={28} />
          </span>
          <h1>¡Listo, quedó cargada!</h1>
          <p>
            Tu solicitud ya está publicada como pendiente para que un profesional de{' '}
            <strong>{creada.zona.nombre}</strong> la tome.
          </p>
          <div className="confirm-ticket__actions">
            <button type="button" className="btn btn-outline" onClick={() => setCreada(null)}>
              Cargar otra
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/seguimiento')}
            >
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

      <ApiState loading={cargando} error={errorCatalogos} loadingText="Cargando catálogos…" />

      {!cargando && !errorCatalogos && (
        <form className="form ticket" onSubmit={handleSubmit}>
          <label className="field">
            <span>Título del problema</span>
            <input
              value={form.titulo}
              onChange={(e) => actualizar('titulo', e.target.value)}
              placeholder="Ej: pérdida de agua en el baño"
              maxLength={150}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Categoría</span>
              <select
                value={form.id_categoria}
                onChange={(e) => actualizar('id_categoria', e.target.value)}
              >
                <option value="">Elegí una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Zona</span>
              <select value={form.id_zona} onChange={(e) => actualizar('id_zona', e.target.value)}>
                <option value="">Elegí una zona</option>
                {zonas.map((z) => (
                  <option key={z.id_zona} value={z.id_zona}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Dirección</span>
            <input
              value={form.direccion}
              onChange={(e) => actualizar('direccion', e.target.value)}
              placeholder="Calle, número, piso/depto"
              maxLength={255}
            />
          </label>

          <label className="field">
            <span>Descripción</span>
            <textarea
              rows={4}
              value={form.descripcion}
              onChange={(e) => actualizar('descripcion', e.target.value)}
              placeholder="Contanos desde cuándo pasa, qué probaste, y cualquier detalle útil."
            />
          </label>

          <div className="field">
            <span>Urgencia</span>
            <div className="chip-row">
              {urgencias.map((u) => (
                <button
                  key={u.id_urgencia}
                  type="button"
                  className={
                    'chip' + (Number(form.id_urgencia) === u.id_urgencia ? ' chip--active' : '')
                  }
                  onClick={() => actualizar('id_urgencia', u.id_urgencia)}
                >
                  {u.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Fotos del problema, antes del arreglo (opcional)</span>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => setFotos(Array.from(e.target.files ?? []))}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fotoInputRef.current?.click()}
            >
              Elegir fotos
            </button>
            {fotos.length > 0 && (
              <small className="auth-card__hint">
                {fotos.length} archivo{fotos.length > 1 ? 's' : ''} seleccionado
                {fotos.length > 1 ? 's' : ''}
              </small>
            )}
          </div>

          {error && <p className="form-error">No se pudo publicar: {error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
            {enviando ? 'Publicando…' : 'Publicar solicitud'}
          </button>
        </form>
      )}
    </div>
  )
}

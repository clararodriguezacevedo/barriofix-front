import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSolicitudes } from '../context/SolicitudesContext'
import { useCatalogos } from '../context/CatalogosContext'
import { IconCheck } from '../components/Icons'
import ApiState from '../components/ApiState'
import { esperarFotos } from '../api/client'
import { UbicacionPicker } from '../components/MapaUbicacion'
import FotosSelector, { useFotos } from '../components/FotosSelector'

// Normaliza un nombre de barrio/zona para comparar sin que molesten acentos,
// mayusculas, espacios de mas o el articulo inicial ("La Boca" vs "Boca").
function normalizarZona(nombre) {
  return (nombre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/^(la|el|los|las)\s+/, '')
}

// Busca en el catalogo la zona que corresponde al barrio que devolvio el mapa.
// Primero intenta match exacto normalizado y despues uno mas laxo por inclusion.
function buscarZona(zonas, barrio) {
  if (!barrio) return null
  const objetivo = normalizarZona(barrio)
  return (
    zonas.find((z) => normalizarZona(z.nombre) === objetivo) ||
    zonas.find((z) => {
      const n = normalizarZona(z.nombre)
      return n.includes(objetivo) || objetivo.includes(n)
    }) ||
    null
  )
}

export default function NewRequest() {
  const { crear, recargar } = useSolicitudes()
  const { categorias, zonas, urgencias, cargando, error: errorCatalogos } = useCatalogos()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    direccion: '',
    piso: '',
    id_categoria: '',
    id_zona: '',
    id_urgencia: '',
  })
  const fotos = useFotos()
  const [ubicacion, setUbicacion] = useState(null)
  // Feedback de la deteccion de zona por el mapa: { estado, nombre }.
  // estado: 'match' (se autoselecciono) | 'sinMatch' (barrio sin zona en el catalogo).
  const [zonaDetectada, setZonaDetectada] = useState(null)
  const [creada, setCreada] = useState(null)
  // Solicitud ya publicada a la que le fallaron fotos: se reintentan sin volver a crearla
  const [pendienteFotos, setPendienteFotos] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

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

  // Cuando el mapa detecta un barrio (por el pin o por la dirección elegida),
  // alineamos la zona: si el barrio existe en el catalogo lo autoseleccionamos;
  // si no, avisamos y dejamos la zona que el usuario haya elegido a mano.
  function onZonaDetectada(barrio) {
    const zona = buscarZona(zonas, barrio)
    if (zona) {
      actualizar('id_zona', String(zona.id_zona))
      setZonaDetectada({ estado: 'match', nombre: zona.nombre })
    } else if (barrio) {
      setZonaDetectada({ estado: 'sinMatch', nombre: barrio })
    } else {
      setZonaDetectada(null)
    }
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
    if (fotos.preparando) {
      setError('Esperá a que terminen de cargarse las fotos.')
      return
    }
    if (fotos.fotos.some((f) => f.estado === 'invalida')) {
      setError('Hay fotos que no se pueden subir. Sacalas o cambialas antes de publicar.')
      return
    }

    setEnviando(true)
    let solicitud
    try {
      solicitud = await crear({
        titulo: form.titulo,
        descripcion: form.descripcion,
        direccion: form.piso.trim()
          ? `${form.direccion.trim()}, ${form.piso.trim()}`
          : form.direccion.trim(),
        id_categoria: Number(form.id_categoria),
        id_zona: Number(form.id_zona),
        id_urgencia: Number(form.id_urgencia),
        ...(ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng } : {}),
      })

    } catch (e) {
      setError(`No se pudo publicar: ${e.message}`)
      setEnviando(false)
      return
    }
    // Las fotos van después: la solicitud tiene que existir para poder
    // colgarles el id_solicitud y armar la key de S3.
    await subirFotos(solicitud)
    setEnviando(false)
  }

  async function subirFotos(solicitud) {
    setError(null)
    // Las ya subidas en un intento anterior también cuentan para la espera
    const previas = fotos.fotos.filter((f) => f.estado === 'subida').length
    const { subidas, fallidas } = await fotos.subirTodas(solicitud.id_solicitud)
    if (subidas > 0) {
      // Las fotos se registran de forma asíncrona (S3 -> Lambda): esperamos a
      // que aparezcan y recargamos, así Seguimiento ya las muestra
      await esperarFotos(solicitud.id_solicitud, previas + subidas)
      await recargar()
    }
    if (fallidas > 0) {
      setPendienteFotos(solicitud)
      return
    }
    setPendienteFotos(null)
    setCreada(solicitud)
    fotos.limpiar()
  }

  async function reintentarFotos() {
    setEnviando(true)
    await subirFotos(pendienteFotos)
    setEnviando(false)
  }

  if (pendienteFotos) {
    const fallidas = fotos.fotos.filter((f) => f.estado === 'error').length
    return (
      <div className="page page--narrow">
        <div className="ticket form">
          <h1 className="page__title">La solicitud quedó publicada</h1>
          <p className="page__lead">
            {fallidas > 0
              ? `Pero ${fallidas === 1 ? 'una foto no se pudo subir' : `${fallidas} fotos no se pudieron subir`}. Podés reintentar, sacarlas o seguir sin ellas.`
              : 'Ya no quedan fotos pendientes.'}
          </p>
          <FotosSelector
            fotos={fotos.fotos}
            onAgregar={fotos.agregar}
            onQuitar={fotos.quitar}
            deshabilitado={enviando}
          />
          <div className="confirm-ticket__actions">
            <button
              type="button"
              className="btn btn-outline"
              disabled={enviando}
              onClick={() => {
                setCreada(pendienteFotos)
                setPendienteFotos(null)
                fotos.limpiar()
              }}
            >
              Seguir sin esas fotos
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={enviando || fotos.paraSubir === 0}
              onClick={reintentarFotos}
            >
              {enviando ? 'Subiendo…' : 'Reintentar'}
            </button>
          </div>
        </div>
      </div>
    )
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
              onClick={() =>
                navigate('/seguimiento', { state: { seleccionar: creada.id_solicitud } })
              }
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

          <div className="field">
            <span>Dirección</span>
            <UbicacionPicker
              direccion={form.direccion}
              onDireccionChange={(valor) => actualizar('direccion', valor)}
              ubicacion={ubicacion}
              onUbicacionChange={setUbicacion}
              onZona={onZonaDetectada}
            />
            {zonaDetectada?.estado === 'match' && (
              <small className="auth-card__hint">
                Zona detectada por la ubicación: <strong>{zonaDetectada.nombre}</strong>.
              </small>
            )}
            {zonaDetectada?.estado === 'sinMatch' && (
              <small className="auth-card__hint">
                La ubicación cae en <strong>{zonaDetectada.nombre}</strong>, que no está en la lista
                de zonas. Elegí la más cercana a mano.
              </small>
            )}
          </div>

          <label className="field">
            <span>Piso, depto o referencia (opcional)</span>
            <input
              value={form.piso}
              onChange={(e) => actualizar('piso', e.target.value)}
              placeholder="Ej: 3° B, timbre que no anda"
              maxLength={50}
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
            <FotosSelector
              fotos={fotos.fotos}
              onAgregar={fotos.agregar}
              onQuitar={fotos.quitar}
              deshabilitado={enviando}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
            {enviando
              ? fotos.fotos.some((f) => f.estado === 'subiendo')
                ? 'Subiendo fotos…'
                : 'Publicando…'
              : 'Publicar solicitud'}
          </button>
        </form>
      )}
    </div>
  )
}

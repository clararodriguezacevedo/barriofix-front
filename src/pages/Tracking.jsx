import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchSeguimiento, subirFoto } from '../api/client'
import { useSolicitudes } from '../context/SolicitudesContext'
import { useAuth } from '../context/AuthContext'
import { ESTADOS, ESTADO_LABEL, ORDEN_FILTROS, PASOS } from '../data/estados'
import StatusBadge from '../components/StatusBadge'
import UrgenciaBadge from '../components/UrgenciaBadge'
import Modal from '../components/Modal'
import ApiState from '../components/ApiState'
import { IconMapPin, IconUser } from '../components/Icons'

function nombreCompleto(p) {
  return p ? `${p.nombre} ${p.apellido}` : null
}

function fechaHora(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

/**
 * Contenido del modal de historial. La info se muestra jerarquizada:
 * primero el estado (color + label), despues las fechas de duracion, y solo
 * si existe, el actor + motivo en una linea secundaria.
 */
function HistorialModal({ open, onClose, idSolicitud }) {
  const [filas, setFilas] = useState([])
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!open || !idSolicitud) return
    setCargando(true)
    fetchSeguimiento(idSolicitud)
      .then((d) => {
        setFilas(d)
        setError(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [open, idSolicitud])

  return (
    <Modal open={open} onClose={onClose} title="Historial de la solicitud">
      {cargando && <p className="empty-state">Cargando…</p>}
      {error && <p className="form-error">{error}</p>}
      {!cargando && !error && (
        <ul className="ticket__meta">
          {filas.map((f) => (
            <li key={f.id_seguimiento} style={{ display: 'block' }}>
              <StatusBadge estado={f.estado} />{' '}
              <span>
                desde {fechaHora(f.fecha_desde)}
                {f.fecha_hasta ? ` hasta ${fechaHora(f.fecha_hasta)}` : ' (actual)'}
              </span>
              {(f.profesional || f.motivo) && (
                <div style={{ fontSize: '12.5px', marginTop: '2px' }}>
                  {f.profesional ? nombreCompleto(f.profesional) : ''}
                  {f.profesional && f.motivo ? '. ' : ''}
                  {f.motivo ?? ''}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="dialog-body__actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  )
}

/** Modal reusable para acciones que piden un motivo opcional antes de
 *  confirmar. Se usa tanto para liberar (profesional) como para cancelar
 *  (cliente); asi los dos flujos comparten exactamente la misma UI. */
function MotivoModal({ open, onClose, onConfirmar, trabajando, title, descripcion, verbo, verboEnCurso, placeholder }) {
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    if (!open) setMotivo('')
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="ticket__desc">{descripcion}</p>
      <label className="field">
        <span>Motivo (opcional)</span>
        <textarea
          rows={3}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder={placeholder}
        />
      </label>
      <div className="dialog-body__actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={trabajando}>
          Volver
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onConfirmar(motivo)}
          disabled={trabajando}
        >
          {trabajando ? verboEnCurso : verbo}
        </button>
      </div>
    </Modal>
  )
}

/** Modal de "Mas opciones": lista compacta de acciones secundarias apiladas
 *  verticalmente. El caller decide que items pasar segun el rol y el estado. */
function OpcionesModal({ open, onClose, items }) {
  return (
    <Modal open={open} onClose={onClose} title="Más opciones">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            className={'btn btn-sm ' + (item.destructivo ? 'btn-outline' : 'btn-outline')}
            onClick={() => {
              onClose()
              item.onClick()
            }}
            disabled={item.disabled}
            style={{ justifyContent: 'flex-start' }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="dialog-body__actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  )
}

function SubirFotos({ idSolicitud, onSubida, onError }) {
  const inputRef = useRef(null)
  const [subiendo, setSubiendo] = useState(false)

  async function enviar(archivos) {
    if (archivos.length === 0) return
    setSubiendo(true)
    try {
      for (const archivo of archivos) {
        await subirFoto(idSolicitud, archivo)
      }
      if (inputRef.current) inputRef.current.value = ''
      await onSubida()
    } catch (e) {
      onError(e.message)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={subiendo}
        onClick={() => inputRef.current?.click()}
      >
        {subiendo ? 'Subiendo…' : 'Subir foto del trabajo'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => enviar(Array.from(e.target.files ?? []))}
      />
    </>
  )
}

export default function Tracking() {
  const { solicitudes, cargando, error, recargar, iniciar, resolver, liberar, cancelar } =
    useSolicitudes()
  const { usuario } = useAuth()
  const location = useLocation()
  // Si venimos de "Tomar trabajo", arrancamos con esa solicitud seleccionada.
  const [seleccionada, setSeleccionada] = useState(location.state?.seleccionar ?? null)
  const [accionError, setAccionError] = useState(null)
  const [trabajando, setTrabajando] = useState(false)
  const [refresco, setRefresco] = useState(0)
  const [filtroEstado, setFiltroEstado] = useState(null)
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const [liberarAbierto, setLiberarAbierto] = useState(false)
  const [cancelarAbierto, setCancelarAbierto] = useState(false)
  const [opcionesAbierto, setOpcionesAbierto] = useState(false)

  const conteoPorEstado = useMemo(() => {
    const acc = {}
    for (const s of solicitudes) {
      const n = s.estado?.nombre
      acc[n] = (acc[n] ?? 0) + 1
    }
    return acc
  }, [solicitudes])

  const visibles = useMemo(() => {
    if (!filtroEstado) return solicitudes
    return solicitudes.filter((s) => s.estado?.nombre === filtroEstado)
  }, [solicitudes, filtroEstado])

  useEffect(() => {
    // Solo reseleccionamos cuando ya hay lista: así una preselección que todavía
    // no llegó en los datos (recién tomada) no se pisa mientras carga.
    if (visibles.length > 0 && !visibles.some((s) => s.id_solicitud === seleccionada)) {
      setSeleccionada(visibles[0]?.id_solicitud ?? null)
    }
  }, [visibles, seleccionada])

  const actual = visibles.find((s) => s.id_solicitud === seleccionada)
  const nombreEstado = actual?.estado?.nombre
  const pasoActual = PASOS.indexOf(nombreEstado)

  const soyElCliente = actual && usuario && actual.cliente?.id_usuario === usuario.id_usuario
  const soyElProfesional = actual && usuario && actual.profesional?.id_usuario === usuario.id_usuario
  const enCurso = [ESTADOS.ASIGNADO, ESTADOS.EN_PROGRESO].includes(nombreEstado)

  async function ejecutar(accion) {
    setTrabajando(true)
    setAccionError(null)
    try {
      await accion()
      setRefresco((n) => n + 1)
    } catch (e) {
      setAccionError(e.message)
    } finally {
      setTrabajando(false)
    }
  }

  async function confirmarLiberar(motivo) {
    setTrabajando(true)
    setAccionError(null)
    try {
      await liberar(actual.id_solicitud, motivo || null)
      setLiberarAbierto(false)
      setRefresco((n) => n + 1)
    } catch (e) {
      setAccionError(e.message)
    } finally {
      setTrabajando(false)
    }
  }

  async function confirmarCancelar(motivo) {
    setTrabajando(true)
    setAccionError(null)
    try {
      await cancelar(actual.id_solicitud, motivo || null)
      setCancelarAbierto(false)
      setRefresco((n) => n + 1)
    } catch (e) {
      setAccionError(e.message)
    } finally {
      setTrabajando(false)
    }
  }

  // Solo la accion primaria queda visible en el footer. Todo lo demas
  // (historial, subir foto, liberar/cancelar) va en el modal "Mas opciones".
  let accionPrimaria = null
  if (soyElProfesional && nombreEstado === ESTADOS.ASIGNADO) {
    accionPrimaria = (
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={trabajando}
        onClick={() => ejecutar(() => iniciar(actual.id_solicitud))}
      >
        Empezar el trabajo
      </button>
    )
  } else if (soyElProfesional && nombreEstado === ESTADOS.EN_PROGRESO) {
    accionPrimaria = (
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={trabajando}
        onClick={() => ejecutar(() => resolver(actual.id_solicitud))}
      >
        Marcar como resuelto
      </button>
    )
  }

  // Ref del input file oculto para el item "Subir foto" del modal de opciones.
  const fotoInputRef = useRef(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)

  async function subirArchivos(archivos) {
    if (archivos.length === 0) return
    setSubiendoFoto(true)
    setAccionError(null)
    try {
      for (const archivo of archivos) {
        await subirFoto(actual.id_solicitud, archivo)
      }
      if (fotoInputRef.current) fotoInputRef.current.value = ''
      await recargar()
      setRefresco((n) => n + 1)
    } catch (e) {
      setAccionError(e.message)
    } finally {
      setSubiendoFoto(false)
    }
  }

  const opcionesModal = actual
    ? [
        { label: 'Ver historial', onClick: () => setHistorialAbierto(true) },
        ...(soyElProfesional && enCurso
          ? [
              {
                label: subiendoFoto ? 'Subiendo foto...' : 'Subir foto del trabajo',
                onClick: () => fotoInputRef.current?.click(),
                disabled: subiendoFoto,
              },
              {
                label: 'Liberar trabajo',
                onClick: () => setLiberarAbierto(true),
                destructivo: true,
              },
            ]
          : []),
        ...(soyElCliente &&
        [ESTADOS.PENDIENTE, ESTADOS.ASIGNADO, ESTADOS.EN_PROGRESO].includes(nombreEstado)
          ? [
              {
                label: 'Cancelar solicitud',
                onClick: () => setCancelarAbierto(true),
                destructivo: true,
              },
            ]
          : []),
      ]
    : []

  // Se muestra un titulo distinto segun el rol para no mezclar contextos.
  // Un usuario que sea las dos cosas ve ambas listas mezcladas y el titulo
  // combinado, pero los pure clientes / pure profesionales ven solo el suyo.
  const soloProfesional = usuario?.es_profesional && !usuario?.es_cliente
  const soloCliente = usuario?.es_cliente && !usuario?.es_profesional
  const pageTitle = soloProfesional
    ? 'Mis trabajos asignados'
    : soloCliente
      ? 'Mis solicitudes'
      : 'Seguimiento de solicitudes'
  const pageLead = soloProfesional
    ? 'Los trabajos que aceptaste y todavia estan en curso.'
    : soloCliente
      ? 'Las solicitudes que pediste y en que estado estan hoy.'
      : 'Tus solicitudes como vecino/a y los trabajos que tenes asignados como profesional.'
  const emptyMsg = soloProfesional
    ? 'Todavia no tenes trabajos asignados. Miralos en Trabajos.'
    : soloCliente
      ? 'Todavia no cargaste ninguna solicitud.'
      : 'Todavia no tenes solicitudes ni trabajos asignados.'

  return (
    <div className="page page--tracking">
      <h1 className="page__title">{pageTitle}</h1>
      <p className="page__lead">{pageLead}</p>

      <ApiState loading={cargando} error={error} loadingText="Cargando solicitudes…" />

      {!cargando && !error && solicitudes.length > 0 && (
        <div className="chip-row chip-row--filters">
          <button
            type="button"
            className={'chip' + (filtroEstado === null ? ' chip--active' : '')}
            onClick={() => setFiltroEstado(null)}
          >
            Todas ({solicitudes.length})
          </button>
          {ORDEN_FILTROS.filter((n) => conteoPorEstado[n]).map((n) => (
            <button
              key={n}
              type="button"
              className={'chip' + (filtroEstado === n ? ' chip--active' : '')}
              onClick={() => setFiltroEstado(n)}
            >
              {ESTADO_LABEL[n]} ({conteoPorEstado[n]})
            </button>
          ))}
        </div>
      )}

      {!cargando && !error && solicitudes.length === 0 && (
        <p className="empty-state">{emptyMsg}</p>
      )}

      {!cargando && !error && visibles.length === 0 && solicitudes.length > 0 && (
        <p className="empty-state">Ninguna solicitud con este filtro.</p>
      )}

      {!cargando && !error && visibles.length > 0 && (
        <div className="tracking-layout">
          <ul className="tracking-list">
            {visibles.map((s) => (
              <li key={s.id_solicitud}>
                <button
                  type="button"
                  className={
                    'tracking-list__item' + (s.id_solicitud === seleccionada ? ' is-selected' : '')
                  }
                  onClick={() => {
                    setSeleccionada(s.id_solicitud)
                    setAccionError(null)
                  }}
                >
                  <span className="tracking-list__title">{s.titulo}</span>
                  <StatusBadge estado={s.estado} />
                </button>
              </li>
            ))}
          </ul>

          {actual && (
            <div className="ticket tracking-detail">
              <div className="ticket__top">
                <StatusBadge estado={actual.estado} />
              </div>
              <h2 className="ticket__title">{actual.titulo}</h2>

              <div className="chip-row">
                <span className="chip">{actual.categoria?.nombre}</span>
                <span className="chip">{actual.zona?.nombre}</span>
                <UrgenciaBadge urgencia={actual.urgencia} />
              </div>

              {nombreEstado === ESTADOS.CANCELADO ? (
                <p className="empty-state empty-state--inline">
                  Solicitud cancelada por el cliente el{' '}
                  {fechaHora(actual.fecha_cancelacion_cliente)}.
                </p>
              ) : (
                <ol className="stepper">
                  {PASOS.map((paso, i) => (
                    <li
                      key={paso}
                      className={
                        'stepper__step' +
                        (i < pasoActual ? ' is-done' : '') +
                        (i === pasoActual ? ' is-current' : '')
                      }
                    >
                      <span className="stepper__dot" />
                      <span className="stepper__label">{ESTADO_LABEL[paso]}</span>
                    </li>
                  ))}
                </ol>
              )}

              <ul className="ticket__meta">
                <li>
                  <IconMapPin width={16} height={16} />
                  <span>
                    <strong>Dirección:</strong> {actual.direccion}
                  </span>
                </li>
                <li>
                  <IconUser width={16} height={16} />
                  <span>
                    <strong>Cliente:</strong> {nombreCompleto(actual.cliente)}
                    {actual.profesional
                      ? `, asignado a ${nombreCompleto(actual.profesional)}`
                      : ', sin profesional asignado aún'}
                  </span>
                </li>
              </ul>

              <p className="ticket__desc-label">Descripción</p>

              <p className="ticket__desc">{actual.descripcion}</p>

              {actual.fotos?.length > 0 && (
                <div className="media-grid">
                  {actual.fotos.map((f) => (
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

              {accionError && <p className="form-error">{accionError}</p>}

              {nombreEstado === ESTADOS.PENDIENTE && (
                <p className="empty-state empty-state--inline">
                  Todavía nadie tomó este trabajo. Se ve en la lista de trabajos disponibles de los
                  profesionales de {actual.categoria?.nombre}.
                </p>
              )}
              {nombreEstado === ESTADOS.RESUELTO && (
                <p className="empty-state empty-state--inline">
                  Trabajo resuelto
                  {actual.calificacion
                    ? `, calificado con ${actual.calificacion.puntuacion} de 5.`
                    : '. Podés calificarlo desde el historial.'}
                </p>
              )}

              {/* Estados finales (resuelto/cancelado) no muestran "Mas opciones":
                  las unicas acciones posibles son ver el historial, que se
                  ofrece como boton directo chico. */}
              <div className="ticket__footer chip-row">
                {accionPrimaria}
                {opcionesModal.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setOpcionesAbierto(true)}
                  >
                    Más opciones
                  </button>
                )}
                {opcionesModal.length === 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setHistorialAbierto(true)}
                  >
                    Ver historial
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fotoInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => subirArchivos(Array.from(e.target.files ?? []))}
      />

      <HistorialModal
        open={historialAbierto}
        onClose={() => setHistorialAbierto(false)}
        idSolicitud={actual?.id_solicitud}
      />

      <MotivoModal
        open={liberarAbierto}
        onClose={() => setLiberarAbierto(false)}
        onConfirmar={confirmarLiberar}
        trabajando={trabajando}
        title="Liberar el trabajo"
        descripcion="La solicitud vuelve al pool para que otro profesional la tome. Vas a dejar de tenerla asignada."
        placeholder="Contá por qué la liberás para que el próximo profesional entienda el contexto."
        verbo="Liberar"
        verboEnCurso="Liberando…"
      />

      <MotivoModal
        open={cancelarAbierto}
        onClose={() => setCancelarAbierto(false)}
        onConfirmar={confirmarCancelar}
        trabajando={trabajando}
        title="Cancelar la solicitud"
        descripcion="La solicitud queda cancelada y ningún profesional la va a poder tomar."
        placeholder="Contá por qué la cancelás (opcional)."
        verbo="Cancelar solicitud"
        verboEnCurso="Cancelando…"
      />

      <OpcionesModal
        open={opcionesAbierto}
        onClose={() => setOpcionesAbierto(false)}
        items={opcionesModal}
      />
    </div>
  )
}

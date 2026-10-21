import { useEffect, useRef, useState } from 'react'
import { prepararFoto, subirFoto } from '../api/client'

let siguienteId = 0

/** Estado de las fotos elegidas antes de subirlas. Cada foto se prepara
 *  (redimensiona y comprime) apenas se elige, así el preview es lo mismo que se
 *  va a subir y los errores de formato aparecen antes de publicar.
 *
 *  estado: preparando | lista | invalida | subiendo | subida | error */
export function useFotos() {
  const [fotos, setFotos] = useState([])
  const fotosRef = useRef(fotos)
  fotosRef.current = fotos

  function actualizar(id, cambios) {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, ...cambios } : f)))
  }

  function agregar(archivos) {
    const nuevas = archivos.map((archivo) => ({
      id: ++siguienteId,
      nombre: archivo.name,
      estado: 'preparando',
      blob: null,
      url: null,
      error: null,
    }))
    setFotos((prev) => [...prev, ...nuevas])
    nuevas.forEach((foto, i) => {
      prepararFoto(archivos[i])
        .then((blob) => actualizar(foto.id, { estado: 'lista', blob, url: URL.createObjectURL(blob) }))
        .catch((e) => actualizar(foto.id, { estado: 'invalida', error: e.message }))
    })
  }

  function quitar(id) {
    const foto = fotosRef.current.find((f) => f.id === id)
    if (foto?.url) URL.revokeObjectURL(foto.url)
    setFotos((prev) => prev.filter((f) => f.id !== id))
  }

  function limpiar() {
    fotosRef.current.forEach((f) => f.url && URL.revokeObjectURL(f.url))
    setFotos([])
  }

  /** Sube de a una las fotos listas (y reintenta las que fallaron). Devuelve
   *  cuántas se subieron y cuántas fallaron. Las inválidas no se suben. */
  async function subirTodas(idSolicitud) {
    let subidas = 0
    let fallidas = 0
    for (const foto of fotosRef.current) {
      if (foto.estado !== 'lista' && foto.estado !== 'error') continue
      actualizar(foto.id, { estado: 'subiendo', error: null })
      try {
        await subirFoto(idSolicitud, foto.blob)
        actualizar(foto.id, { estado: 'subida' })
        subidas++
      } catch (e) {
        actualizar(foto.id, { estado: 'error', error: e.message })
        fallidas++
      }
    }
    return { subidas, fallidas }
  }

  // Al desmontar se liberan los previews
  useEffect(() => () => fotosRef.current.forEach((f) => f.url && URL.revokeObjectURL(f.url)), [])

  const preparando = fotos.some((f) => f.estado === 'preparando')
  const paraSubir = fotos.filter((f) => f.estado === 'lista' || f.estado === 'error').length
  return { fotos, agregar, quitar, limpiar, subirTodas, preparando, paraSubir }
}

const ETIQUETA = {
  preparando: 'Preparando…',
  subiendo: 'Subiendo…',
  subida: 'Subida',
}

/** Grilla de previews con un botón para sacar cada foto y otro para sumar más.
 *  Las fotos que no se pueden subir muestran el motivo en la misma tarjeta. */
export default function FotosSelector({ fotos, onAgregar, onQuitar, deshabilitado, textoBoton }) {
  const inputRef = useRef(null)

  return (
    <div className="fotos-selector">
      {fotos.length > 0 && (
        <ul className="fotos-selector__grilla">
          {fotos.map((f) => {
            const conProblema = f.estado === 'invalida' || f.estado === 'error'
            return (
              <li
                key={f.id}
                className={'fotos-selector__item' + (conProblema ? ' is-error' : '')}
              >
                {f.url ? (
                  <img src={f.url} alt={f.nombre} />
                ) : (
                  <div className="fotos-selector__vacio">{f.nombre}</div>
                )}
                {ETIQUETA[f.estado] && (
                  <span className={'fotos-selector__estado is-' + f.estado}>
                    {ETIQUETA[f.estado]}
                  </span>
                )}
                {conProblema && <p className="fotos-selector__error">{f.error}</p>}
                {f.estado !== 'subiendo' && f.estado !== 'subida' && !deshabilitado && (
                  <button
                    type="button"
                    className="fotos-selector__quitar"
                    onClick={() => onQuitar(f.id)}
                    aria-label={`Sacar ${f.nombre}`}
                    title="Sacar esta foto"
                  >
                    ×
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          onAgregar(Array.from(e.target.files ?? []))
          // Para poder volver a elegir el mismo archivo después de sacarlo
          e.target.value = ''
        }}
      />
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={deshabilitado}
      >
        {textoBoton ?? (fotos.length > 0 ? 'Agregar más fotos' : 'Elegir fotos')}
      </button>
    </div>
  )
}

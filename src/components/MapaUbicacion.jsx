import { useEffect, useRef, useState } from 'react'
import { config } from '../config'

// Centro por defecto cuando la solicitud todavía no tiene ubicación (CABA)
const CENTRO_DEFAULT = { lat: -34.6037, lng: -58.3816 }

// Carga el SDK de Google Maps una sola vez y lo comparte entre componentes
let mapsPromise = null
function cargarMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    s.async = true
    s.onload = () => resolve(window.google.maps)
    s.onerror = () => reject(new Error('No se pudo cargar Google Maps'))
    document.head.appendChild(s)
  })
  return mapsPromise
}

/** Mapa interactivo para que el cliente marque un pin. Llama onChange(lat, lng)
 *  en cada click. Sin API key no renderiza nada (el form sigue con la dirección). */
export function MapaPicker({ lat, lng, onChange }) {
  const divRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [estado, setEstado] = useState('cargando')

  useEffect(() => {
    if (!config.googleMapsApiKey) {
      setEstado('sinKey')
      return
    }
    let cancelado = false
    cargarMaps(config.googleMapsApiKey)
      .then((maps) => {
        if (cancelado || !divRef.current) return
        const tieneInicial = lat != null && lng != null
        const centro = tieneInicial ? { lat, lng } : CENTRO_DEFAULT
        const map = new maps.Map(divRef.current, {
          center: centro,
          zoom: tieneInicial ? 16 : 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        if (tieneInicial) markerRef.current = new maps.Marker({ position: centro, map })
        map.addListener('click', (e) => {
          const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
          if (!markerRef.current) markerRef.current = new maps.Marker({ map })
          markerRef.current.setPosition(pos)
          onChangeRef.current(pos.lat, pos.lng)
        })
        setEstado('listo')
      })
      .catch(() => {
        if (!cancelado) setEstado('error')
      })
    return () => {
      cancelado = true
    }
    // Se inicializa una sola vez; la posición inicial se toma al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (estado === 'sinKey') return null
  return (
    <div>
      <div ref={divRef} className="mapa-picker" style={{ height: 240, borderRadius: 8 }} />
      {estado === 'error' && <small className="form-error">No se pudo cargar el mapa</small>}
      {estado === 'listo' && (
        <small className="auth-card__hint">
          {lat != null && lng != null ? 'Ubicación marcada' : 'Tocá el mapa para marcar la ubicación'}
        </small>
      )}
    </div>
  )
}

/** Vista de la ubicación en una tarjeta: mapa estático clickeable que abre
 *  Google Maps. Sin API key, cae a un link simple. */
export function MapaEstatico({ lat, lng }) {
  if (lat == null || lng == null) return null
  const href = `https://www.google.com/maps?q=${lat},${lng}`
  const key = config.googleMapsApiKey
  if (!key) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="mapa-link">
        Ver ubicación en el mapa
      </a>
    )
  }
  const src =
    'https://maps.googleapis.com/maps/api/staticmap' +
    `?center=${lat},${lng}&zoom=15&size=400x180&scale=2&markers=color:red%7C${lat},${lng}&key=${key}`
  return (
    <a href={href} target="_blank" rel="noreferrer" className="mapa-estatico">
      <img
        src={src}
        alt="Ubicación en el mapa"
        loading="lazy"
        style={{ width: '100%', borderRadius: 8, display: 'block' }}
      />
    </a>
  )
}

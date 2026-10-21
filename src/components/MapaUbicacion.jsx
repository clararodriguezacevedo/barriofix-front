import { useEffect, useRef, useState } from 'react'
import { config } from '../config'

// Centro por defecto cuando todavía no hay ubicación (CABA)
const CENTRO_DEFAULT = { lat: -34.6037, lng: -58.3816 }

// Carga el SDK de Google Maps una sola vez y lo comparte entre componentes.
// Con loading=async las librerías se piden con importLibrary.
let mapsPromise = null
function cargarMaps(apiKey) {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    window.__barriofixMapsListo = () => resolve(window.google.maps)
    const s = document.createElement('script')
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}` +
      '&loading=async&language=es&region=AR&callback=__barriofixMapsListo'
    s.async = true
    s.onerror = () => {
      mapsPromise = null
      reject(new Error('No se pudo cargar Google Maps'))
    }
    document.head.appendChild(s)
  })
  return mapsPromise
}

// "Av. Córdoba 4850, Palermo" a partir de los componentes de una dirección. El
// geocoder y Places los devuelven con nombres distintos (long_name / longText).
// Si falta la calle o el número, cae a la dirección completa sin el país.
function direccionCorta(componentes, completa) {
  const comp = (tipo, corto = false) => {
    const c = componentes?.find((x) => x.types.includes(tipo))
    return corto ? (c?.short_name ?? c?.shortText) : (c?.long_name ?? c?.longText)
  }
  // La calle en su forma corta: "Av. Córdoba" en vez de "Avenida Córdoba"
  const calle = comp('route', true)
  const numero = comp('street_number')
  const barrio = comp('sublocality') || comp('neighborhood') || comp('locality')
  if (calle && numero) return barrio ? `${calle} ${numero}, ${barrio}` : `${calle} ${numero}`
  return (completa ?? '').replace(/, Argentina$/, '')
}

// Barrio de una dirección, para alinear la zona con el punto marcado. Sirve
// tanto para los componentes del geocoder (long_name) como los de Places (longText).
function barrioDe(componentes) {
  const comp = (tipo) => {
    const c = componentes?.find((x) => x.types.includes(tipo))
    return c?.long_name ?? c?.longText ?? null
  }
  return comp('sublocality') || comp('neighborhood') || comp('locality') || null
}

/** Dirección con autocompletado y mapa con pin arrastrable, al estilo de las
 *  apps de delivery: si escribís la dirección, el pin va ahí; si movés el pin,
 *  la dirección se actualiza. Sin API key queda solo el campo de texto. */
export function UbicacionPicker({ direccion, onDireccionChange, ubicacion, onUbicacionChange, onZona }) {
  const sinKey = !config.googleMapsApiKey
  const divRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const markerClassRef = useRef(null)
  const geocoderRef = useRef(null)
  const placesRef = useRef(null)
  const tokenRef = useRef(null)
  const callbacksRef = useRef({ onDireccionChange, onUbicacionChange, onZona })
  callbacksRef.current = { onDireccionChange, onUbicacionChange, onZona }

  const [estado, setEstado] = useState(sinKey ? 'sinKey' : 'cargando')
  const [sugerencias, setSugerencias] = useState([])
  const [activa, setActiva] = useState(-1)
  const [abierta, setAbierta] = useState(false)
  const [buscando, setBuscando] = useState(false)

  // Mueve el pin (creándolo la primera vez) y centra el mapa
  function ponerPin(pos, zoom) {
    if (!markerRef.current) {
      markerRef.current = new markerClassRef.current({ map: mapRef.current, draggable: true })
      markerRef.current.addListener('dragend', (e) => {
        moverDesdeMapa({ lat: e.latLng.lat(), lng: e.latLng.lng() })
      })
    }
    markerRef.current.setPosition(pos)
    mapRef.current.panTo(pos)
    if (zoom) mapRef.current.setZoom(zoom)
  }

  // El pin se movió en el mapa: guardamos la posición y buscamos su dirección
  async function moverDesdeMapa(pos) {
    ponerPin(pos)
    callbacksRef.current.onUbicacionChange(pos)
    setBuscando(true)
    try {
      const { results } = await geocoderRef.current.geocode({ location: pos })
      if (results[0]) {
        callbacksRef.current.onDireccionChange(
          direccionCorta(results[0].address_components, results[0].formatted_address),
        )
        callbacksRef.current.onZona?.(barrioDe(results[0].address_components))
      }
    } catch {
      // Sin dirección para ese punto: queda la que estaba, el pin igual se guarda
    } finally {
      setBuscando(false)
    }
  }

  useEffect(() => {
    if (sinKey) return
    let cancelado = false
    cargarMaps(config.googleMapsApiKey)
      .then(async (maps) => {
        const [{ Map }, { Marker }, { Geocoder }, places] = await Promise.all([
          maps.importLibrary('maps'),
          maps.importLibrary('marker'),
          maps.importLibrary('geocoding'),
          maps.importLibrary('places'),
        ])
        if (cancelado || !divRef.current) return
        markerClassRef.current = Marker
        geocoderRef.current = new Geocoder()
        placesRef.current = places
        tokenRef.current = new places.AutocompleteSessionToken()

        const inicial = ubicacion ?? null
        mapRef.current = new Map(divRef.current, {
          center: inicial ?? CENTRO_DEFAULT,
          zoom: inicial ? 17 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })
        if (inicial) ponerPin(inicial)
        mapRef.current.addListener('click', (e) => {
          moverDesdeMapa({ lat: e.latLng.lat(), lng: e.latLng.lng() })
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

  // Sugerencias mientras se escribe, con una pausa corta para no pedir por tecla
  useEffect(() => {
    if (estado !== 'listo' || !abierta) return
    const texto = direccion.trim()
    if (texto.length < 4) {
      setSugerencias([])
      return
    }
    let cancelado = false
    const t = setTimeout(async () => {
      try {
        const { suggestions } =
          await placesRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: texto,
            includedRegionCodes: ['ar'],
            locationBias: mapRef.current.getCenter(),
            sessionToken: tokenRef.current,
          })
        if (!cancelado) {
          setSugerencias(suggestions.map((s) => s.placePrediction).filter(Boolean))
          setActiva(-1)
        }
      } catch {
        if (!cancelado) setSugerencias([])
      }
    }, 250)
    return () => {
      cancelado = true
      clearTimeout(t)
    }
  }, [direccion, abierta, estado])

  async function elegir(prediccion) {
    setAbierta(false)
    setSugerencias([])
    onDireccionChange(prediccion.mainText?.toString() ?? prediccion.text.toString())
    try {
      const lugar = prediccion.toPlace()
      await lugar.fetchFields({ fields: ['location', 'addressComponents', 'formattedAddress'] })
      onDireccionChange(direccionCorta(lugar.addressComponents, lugar.formattedAddress))
      onZona?.(barrioDe(lugar.addressComponents))
      const pos = lugar.location.toJSON()
      ponerPin(pos, 17)
      onUbicacionChange(pos)
    } catch {
      // Sin coordenadas: queda la dirección escrita y el usuario puede tocar el mapa
    }
    // Cada búsqueda que termina en una elección cierra la sesión de facturación
    tokenRef.current = new placesRef.current.AutocompleteSessionToken()
  }

  function onKeyDown(e) {
    if (!abierta || sugerencias.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiva((i) => (i + 1) % sugerencias.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiva((i) => (i <= 0 ? sugerencias.length - 1 : i - 1))
    } else if (e.key === 'Enter' && activa >= 0) {
      e.preventDefault()
      elegir(sugerencias[activa])
    } else if (e.key === 'Escape') {
      setAbierta(false)
    }
  }

  let ayuda = null
  if (estado === 'listo') {
    if (buscando) ayuda = 'Buscando la dirección…'
    else if (ubicacion) ayuda = 'Si el pin no quedó justo en la puerta, arrastralo.'
    else ayuda = 'Escribí la dirección y elegila de la lista, o tocá el mapa.'
  }

  return (
    <div className="ubicacion">
      <div className="ubicacion__buscador">
        <input
          value={direccion}
          onChange={(e) => {
            onDireccionChange(e.target.value)
            setAbierta(true)
          }}
          onFocus={() => setAbierta(true)}
          onBlur={() => setTimeout(() => setAbierta(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Calle y número"
          maxLength={200}
          autoComplete="off"
          role="combobox"
          aria-expanded={abierta && sugerencias.length > 0}
          aria-autocomplete="list"
        />
        {abierta && sugerencias.length > 0 && (
          <ul className="ubicacion__sugerencias" role="listbox">
            {sugerencias.map((p, i) => (
              <li
                key={p.placeId}
                role="option"
                aria-selected={i === activa}
                className={i === activa ? 'is-activa' : undefined}
                onMouseDown={(e) => {
                  e.preventDefault()
                  elegir(p)
                }}
              >
                <strong>{p.mainText?.toString() ?? p.text.toString()}</strong>
                {p.secondaryText && <small>{p.secondaryText.toString()}</small>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!sinKey && <div ref={divRef} className="ubicacion__mapa" />}
      {estado === 'error' && <small className="form-error">No se pudo cargar el mapa</small>}
      {ayuda && <small className="auth-card__hint">{ayuda}</small>}
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

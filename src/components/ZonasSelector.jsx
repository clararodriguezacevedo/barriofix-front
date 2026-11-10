import { useEffect, useRef, useState } from 'react'
import { config } from '../config'
import { cargarMaps } from './googleMaps'

// Barrios de CABA (datos abiertos de la Ciudad, simplificados), con el id_zona del catálogo
const GEOJSON = `${import.meta.env.BASE_URL}geo/barrios-caba.geojson`
const CENTRO_CABA = { lat: -34.615, lng: -58.445 }

/** Zonas donde trabaja un profesional. Los barrios de CABA se eligen tocando su
 *  polígono en el mapa; los partidos del AMBA (sin polígono) con chips. Sin API
 *  key o si el mapa falla, todas las zonas quedan como chips. Por debajo es
 *  siempre el catálogo de zonas: el resultado es una lista de id_zona. */
export default function ZonasSelector({ zonas, seleccionadas, onChange }) {
  const sinKey = !config.googleMapsApiKey
  const divRef = useRef(null)
  const mapRef = useRef(null)
  // Los listeners del mapa se registran una vez: leen siempre la selección actual
  const actualRef = useRef({ seleccionadas, onChange })
  actualRef.current = { seleccionadas, onChange }

  const [estado, setEstado] = useState(sinKey ? 'sinMapa' : 'cargando')
  const [conPoligono, setConPoligono] = useState(() => new Set())
  const [sobre, setSobre] = useState(null)

  function alternar(id) {
    const { seleccionadas: actual, onChange: cambiar } = actualRef.current
    cambiar(actual.includes(id) ? actual.filter((z) => z !== id) : [...actual, id])
  }

  useEffect(() => {
    if (sinKey) return
    let cancelado = false
    Promise.all([
      cargarMaps(config.googleMapsApiKey),
      fetch(GEOJSON).then((r) => {
        if (!r.ok) throw new Error('sin GeoJSON')
        return r.json()
      }),
    ])
      .then(async ([maps, geo]) => {
        const { Map } = await maps.importLibrary('maps')
        if (cancelado || !divRef.current) return
        const mapa = new Map(divRef.current, {
          center: CENTRO_CABA,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: 'cooperative',
        })
        mapa.data.addGeoJson(geo)
        mapa.data.addListener('click', (e) => alternar(e.feature.getProperty('id_zona')))
        mapa.data.addListener('mouseover', (e) => {
          mapa.data.overrideStyle(e.feature, { strokeWeight: 2.5 })
          setSobre(e.feature.getProperty('nombre'))
        })
        mapa.data.addListener('mouseout', (e) => {
          mapa.data.revertStyle(e.feature)
          setSobre(null)
        })
        mapRef.current = mapa
        setConPoligono(new Set(geo.features.map((f) => f.properties.id_zona)))
        setEstado('listo')
      })
      .catch(() => {
        if (!cancelado) setEstado('sinMapa')
      })
    return () => {
      cancelado = true
    }
    // El mapa se arma una sola vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pinta la selección con los colores del tema
  useEffect(() => {
    const mapa = mapRef.current
    if (!mapa) return
    const css = getComputedStyle(document.documentElement)
    const color = (v) => css.getPropertyValue(v).trim()
    const elegidas = new Set(seleccionadas)
    mapa.data.setStyle((f) => {
      const activa = elegidas.has(f.getProperty('id_zona'))
      return {
        fillColor: activa ? color('--primary') : color('--ink'),
        fillOpacity: activa ? 0.45 : 0.04,
        strokeColor: activa ? color('--primary-dark') : color('--ink-soft'),
        strokeWeight: 1,
        cursor: 'pointer',
      }
    })
  }, [seleccionadas, estado])

  const conMapa = estado === 'listo'
  const chips = conMapa ? zonas.filter((z) => !conPoligono.has(z.id_zona)) : zonas
  const nombres = seleccionadas.map((id) => zonas.find((z) => z.id_zona === id)?.nombre).filter(Boolean)

  return (
    <div className="zonas-selector">
      {estado !== 'sinMapa' && (
        <div className="zonas-selector__mapa-wrap">
          <div ref={divRef} className="zonas-selector__mapa" />
          {sobre && <span className="zonas-selector__etiqueta">{sobre}</span>}
        </div>
      )}
      {conMapa && (
        <small className="auth-card__hint">
          Tocá los barrios de CABA donde trabajás. Los partidos del conurbano se eligen abajo.
        </small>
      )}
      <div className="chip-row">
        {chips.map((z) => (
          <button
            key={z.id_zona}
            type="button"
            className={'chip' + (seleccionadas.includes(z.id_zona) ? ' chip--active' : '')}
            onClick={() => alternar(z.id_zona)}
          >
            {z.nombre}
          </button>
        ))}
      </div>
      <small className="auth-card__hint">
        {nombres.length ? `Elegiste ${nombres.length}: ${nombres.join(', ')}.` : 'Todavía no elegiste ninguna zona.'}
      </small>
    </div>
  )
}

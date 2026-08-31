import { useEffect, useState } from 'react'
import { fetchMedia, mediaUrl } from '../api/client'
import ApiState from '../components/ApiState'

export default function Media() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMedia()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <h1 className="page__title">Fotos</h1>
      <p className="page__lead">Archivos subidos al bucket de medios de BarrioFix.</p>

      <ApiState loading={loading} error={error} loadingText="Cargando fotos…" />

      {!loading && !error && items.length === 0 && (
        <p className="empty-state">Todavía no hay archivos en el bucket.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="media-grid">
          {items.map((item) => (
            <a key={item.key} href={mediaUrl(item.key)} target="_blank" rel="noreferrer" className="media-item">
              <img src={mediaUrl(item.key)} alt={item.key} loading="lazy" />
              <span className="media-item__key">{item.key}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

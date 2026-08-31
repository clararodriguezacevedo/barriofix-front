export default function ApiState({ loading, error, loadingText = 'Cargando…' }) {
  if (error) return <p className="form-error">No se pudo conectar con el backend: {error}</p>
  if (loading) return <p className="empty-state">{loadingText}</p>
  return null
}

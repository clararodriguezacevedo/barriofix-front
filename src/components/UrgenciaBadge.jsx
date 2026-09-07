/**
 * Badge de urgencia, reutilizando las variantes .badge--* existentes segun
 * la semantica de cada nivel. Sin nuevos colores.
 */
const URGENCIA_CLASS = {
  BAJA: 'badge badge--completo',
  MEDIA: 'badge badge--pendiente',
  ALTA: 'badge badge--progreso',
}

function capitalizar(s) {
  if (!s) return ''
  return s.charAt(0) + s.slice(1).toLowerCase()
}

export default function UrgenciaBadge({ urgencia }) {
  if (!urgencia) return null
  const nombre = typeof urgencia === 'string' ? urgencia : urgencia.nombre
  return (
    <span className={URGENCIA_CLASS[nombre] ?? 'badge'}>
      Urgencia {capitalizar(nombre)}
    </span>
  )
}

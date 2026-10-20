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
  // Lookup en mayúsculas para que el color no dependa de cómo venga el nombre
  // del backend (BAJA, Baja, baja).
  const clase = URGENCIA_CLASS[(nombre ?? '').toUpperCase()] ?? 'badge'
  return <span className={clase}>Urgencia {capitalizar(nombre)}</span>
}

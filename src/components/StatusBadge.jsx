import { ESTADO_CLASS, ESTADO_LABEL } from '../data/estados'

export default function StatusBadge({ estado }) {
  // `estado` puede llegar como el objeto completo del backend o como el nombre.
  const nombre = typeof estado === 'string' ? estado : estado?.nombre
  return (
    <span className={ESTADO_CLASS[nombre] ?? 'badge'}>{ESTADO_LABEL[nombre] ?? nombre}</span>
  )
}

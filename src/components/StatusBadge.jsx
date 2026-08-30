import { STATUS, STATUS_LABEL } from '../data/mockData'

const CLASS_BY_STATUS = {
  [STATUS.PENDIENTE]: 'badge badge--pendiente',
  [STATUS.EN_PROGRESO]: 'badge badge--progreso',
  [STATUS.COMPLETADO]: 'badge badge--completo',
}

export default function StatusBadge({ estado }) {
  return <span className={CLASS_BY_STATUS[estado]}>{STATUS_LABEL[estado]}</span>
}

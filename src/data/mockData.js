export const CATEGORIES = [
  'Plomería',
  'Electricidad',
  'Carpintería',
  'Pintura',
  'Albañilería',
  'Otro',
]

export const URGENCIAS = ['Baja', 'Media', 'Alta']

export const STATUS = {
  PENDIENTE: 'pendiente',
  EN_PROGRESO: 'en_progreso',
  COMPLETADO: 'completado',
}

export const STATUS_LABEL = {
  [STATUS.PENDIENTE]: 'Pendiente',
  [STATUS.EN_PROGRESO]: 'En progreso',
  [STATUS.COMPLETADO]: 'Completado',
}

export const STATUS_STEPS = [STATUS.PENDIENTE, STATUS.EN_PROGRESO, STATUS.COMPLETADO]

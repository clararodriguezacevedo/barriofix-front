// Los nombres coinciden exactamente con la tabla `estado` de la base.

export const ESTADOS = {
  PENDIENTE: 'PENDIENTE',
  ASIGNADO: 'ASIGNADO',
  EN_PROGRESO: 'EN_PROGRESO',
  RESUELTO: 'RESUELTO',
  CANCELADO: 'CANCELADO',
}

export const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  ASIGNADO: 'Asignado',
  EN_PROGRESO: 'En progreso',
  RESUELTO: 'Resuelto',
  CANCELADO: 'Cancelado',
}

// Un color distinto por estado, usando las cinco variantes de .badge en App.css
// (las tres originales + las dos que agregue para asignado/cancelado).
export const ESTADO_CLASS = {
  PENDIENTE: 'badge badge--pendiente',
  ASIGNADO: 'badge badge--asignado',
  EN_PROGRESO: 'badge badge--progreso',
  RESUELTO: 'badge badge--completo',
  CANCELADO: 'badge badge--cancelado',
}

// El camino feliz para el stepper. Cancelado queda afuera: es una salida
// lateral, no un paso mas.
export const PASOS = [
  ESTADOS.PENDIENTE,
  ESTADOS.ASIGNADO,
  ESTADOS.EN_PROGRESO,
  ESTADOS.RESUELTO,
]

// Orden estable para los filtros de la barra superior.
export const ORDEN_FILTROS = [
  ESTADOS.PENDIENTE,
  ESTADOS.ASIGNADO,
  ESTADOS.EN_PROGRESO,
  ESTADOS.RESUELTO,
  ESTADOS.CANCELADO,
]

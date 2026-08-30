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

export const SEED_REQUESTS = [
  {
    id: 'BF-1042',
    titulo: 'Pérdida de agua bajo la pileta de cocina',
    categoria: 'Plomería',
    direccion: 'Calle Los Aromos 214, Villa Alegre',
    descripcion:
      'Gotea agua debajo de la bacha de la cocina cada vez que se usa. Puede ser la conexión del caño flexible.',
    urgencia: 'Alta',
    cliente: 'Marisol Peña',
    profesional: null,
    estado: STATUS.PENDIENTE,
    creado: '2026-08-24',
    rating: null,
    comentario: '',
  },
  {
    id: 'BF-1039',
    titulo: 'Instalación de tomacorrientes en living',
    categoria: 'Electricidad',
    direccion: 'Pasaje Belgrano 88, Villa Alegre',
    descripcion: 'Necesito agregar dos tomas nuevas cerca del televisor y certificar que la línea aguante.',
    urgencia: 'Media',
    cliente: 'Diego Farías',
    profesional: 'Nico Sartori',
    estado: STATUS.EN_PROGRESO,
    creado: '2026-08-20',
    rating: null,
    comentario: '',
  },
  {
    id: 'BF-1031',
    titulo: 'Reparación de puerta de placard descolgada',
    categoria: 'Carpintería',
    direccion: 'Av. San Martín 1350, Villa Alegre',
    descripcion: 'La puerta corrediza se salió del riel superior y no cierra bien.',
    urgencia: 'Baja',
    cliente: 'Marisol Peña',
    profesional: 'Estela Rojas',
    estado: STATUS.COMPLETADO,
    creado: '2026-08-10',
    rating: 5,
    comentario: 'Llegó puntual y dejó todo funcionando mejor que antes.',
  },
  {
    id: 'BF-1027',
    titulo: 'Pintura de frente y reja de entrada',
    categoria: 'Pintura',
    direccion: 'Calle Rivadavia 452, Villa Alegre',
    descripcion: 'Frente con humedad visible y reja oxidada, hay que lijar y pintar todo.',
    urgencia: 'Media',
    cliente: 'Julián Ibáñez',
    profesional: 'Coco Medina',
    estado: STATUS.COMPLETADO,
    creado: '2026-08-02',
    rating: 4,
    comentario: 'Buen trabajo, tardó un día más de lo pactado.',
  },
  {
    id: 'BF-1046',
    titulo: 'Revoque de pared con humedad en baño',
    categoria: 'Albañilería',
    direccion: 'Pje. Los Ceibos 77, Villa Alegre',
    descripcion: 'Hay una mancha de humedad que sigue creciendo cerca de la ducha.',
    urgencia: 'Alta',
    cliente: 'Julián Ibáñez',
    profesional: null,
    estado: STATUS.PENDIENTE,
    creado: '2026-08-27',
    rating: null,
    comentario: '',
  },
]

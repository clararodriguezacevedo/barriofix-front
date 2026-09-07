const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const TOKEN_KEY = 'barriofix_token'

// ---------------------------------------------------------------- token

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Modo privado o storage bloqueado: la sesión dura lo que dure la pestaña.
  }
}

/** Se dispara cuando el backend rechaza el token: el AuthContext escucha esto
 *  y cierra la sesión, para no dejar la app en un limbo de 401 infinitos. */
const SESION_VENCIDA = 'barriofix:sesion-vencida'

export function onSesionVencida(handler) {
  window.addEventListener(SESION_VENCIDA, handler)
  return () => window.removeEventListener(SESION_VENCIDA, handler)
}

// ---------------------------------------------------------------- fetch

async function request(path, { auth = true, json = true, ...options } = {}) {
  const headers = { ...options.headers }
  if (json && options.body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 503) {
    throw new Error('El backend no está disponible (el ALB no tiene targets healthy).')
  }

  if (res.status === 401 && auth) {
    setToken(null)
    window.dispatchEvent(new CustomEvent(SESION_VENCIDA))
    throw new Error('Tu sesión venció. Ingresá de nuevo.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(mensajeDeError(body, res))
  }

  if (res.status === 204) return null
  return res.json()
}

/** FastAPI devuelve `detail` como string en los errores propios y como array
 *  de objetos en los 422 de validación de Pydantic. */
function mensajeDeError(body, res) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const campo = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null
        return campo ? `${campo}: ${d.msg}` : d.msg
      })
      .join('. ')
  }
  return `${res.status} ${res.statusText}`
}

function qs(params) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '' && v !== false,
  )
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries).toString()
}

// ---------------------------------------------------------------- auth

export function registro(payload) {
  return request('/api/auth/registro', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: false,
  })
}

export function login(username, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    auth: false,
  })
}

export function fetchMe() {
  return request('/api/auth/me')
}

export function updateMe(payload) {
  return request('/api/auth/me', { method: 'PUT', body: JSON.stringify(payload) })
}

export function cambiarPassword(passwordActual, passwordNueva) {
  return request('/api/auth/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ password_actual: passwordActual, password_nueva: passwordNueva }),
  })
}

// ---------------------------------------------------------------- catálogos
// Son públicos: el formulario de registro los necesita antes de que haya token.

export function fetchCategorias() {
  return request('/api/categorias?activo=true', { auth: false })
}

export function fetchZonas() {
  return request('/api/zonas?activo=true', { auth: false })
}

export function fetchUrgencias() {
  return request('/api/urgencias?activo=true', { auth: false })
}

export function fetchEstados() {
  return request('/api/estados', { auth: false })
}

// ---------------------------------------------------------------- solicitudes

export function fetchSolicitudes(filtros = {}) {
  return request(`/api/solicitudes${qs(filtros)}`)
}

export function fetchSolicitud(id) {
  return request(`/api/solicitudes/${id}`)
}

export function crearSolicitud(payload) {
  return request('/api/solicitudes', { method: 'POST', body: JSON.stringify(payload) })
}

export function actualizarSolicitud(id, payload) {
  return request(`/api/solicitudes/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function borrarSolicitud(id) {
  return request(`/api/solicitudes/${id}`, { method: 'DELETE' })
}

export function fetchSeguimiento(id) {
  return request(`/api/solicitudes/${id}/seguimiento`)
}

export function aceptarSolicitud(id, motivo) {
  return request(`/api/solicitudes/${id}/aceptar`, {
    method: 'POST',
    body: JSON.stringify({ motivo: motivo ?? null }),
  })
}

export function iniciarSolicitud(id, motivo) {
  return request(`/api/solicitudes/${id}/iniciar`, {
    method: 'POST',
    body: JSON.stringify({ motivo: motivo ?? null }),
  })
}

export function resolverSolicitud(id, motivo) {
  return request(`/api/solicitudes/${id}/resolver`, {
    method: 'POST',
    body: JSON.stringify({ motivo: motivo ?? null }),
  })
}

/** El profesional devuelve el trabajo al pool: vuelve a PENDIENTE y sin
 *  profesional asignado. No es lo mismo que cancelar: la solicitud sigue viva. */
export function liberarSolicitud(id, motivo) {
  return request(`/api/solicitudes/${id}/liberar`, {
    method: 'POST',
    body: JSON.stringify({ motivo: motivo ?? null }),
  })
}

export function cancelarSolicitud(id, motivo) {
  return request(`/api/solicitudes/${id}/cancelar`, {
    method: 'POST',
    body: JSON.stringify({ motivo: motivo ?? null }),
  })
}

export function fetchTrabajos(filtros = {}) {
  return request(`/api/trabajos${qs(filtros)}`)
}

// ---------------------------------------------------------------- profesionales

export function fetchProfesionales(filtros = {}) {
  return request(`/api/profesionales${qs(filtros)}`)
}

export function fetchProfesional(id) {
  return request(`/api/profesionales/${id}`)
}

export function actualizarProfesional(id, descripcion) {
  return request(`/api/profesionales/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ descripcion }),
  })
}

export function cambiarDisponible(id, disponible) {
  return request(`/api/profesionales/${id}/disponible`, {
    method: 'PATCH',
    body: JSON.stringify({ disponible }),
  })
}

export function reemplazarCategorias(id, categorias) {
  return request(`/api/profesionales/${id}/categorias`, {
    method: 'PUT',
    body: JSON.stringify({ categorias }),
  })
}

export function altaProfesional(idUsuario, descripcion) {
  return request(`/api/usuarios/${idUsuario}/profesional`, {
    method: 'POST',
    body: JSON.stringify({ descripcion: descripcion ?? null }),
  })
}

// ---------------------------------------------------------------- fotos

export function fetchFotos(idSolicitud) {
  return request(`/api/solicitudes/${idSolicitud}/fotos`)
}

/** El tipo de foto lo decide el backend segun el rol: ANTES si la sube el
 *  cliente, DESPUES si la sube el profesional asignado. */
export function subirFoto(idSolicitud, archivo, { descripcion = '' } = {}) {
  const form = new FormData()
  form.append('archivo', archivo)
  form.append('descripcion', descripcion)
  // Sin Content-Type: el browser tiene que poner el boundary del multipart.
  return request(`/api/solicitudes/${idSolicitud}/fotos`, {
    method: 'POST',
    body: form,
    json: false,
  })
}

export function borrarFoto(idFoto) {
  return request(`/api/fotos/${idFoto}`, { method: 'DELETE' })
}

/** URL absoluta del binario. Va directo en un <img src>, por eso el endpoint
 *  no pide token: el browser no manda Authorization en las etiquetas img. */
export function fotoUrl(idFoto) {
  return `${API_URL}/api/fotos/${idFoto}/contenido`
}

// ---------------------------------------------------------------- calificaciones

export function calificar(idSolicitud, puntuacion, comentario) {
  return request(`/api/solicitudes/${idSolicitud}/calificacion`, {
    method: 'POST',
    body: JSON.stringify({ puntuacion, comentario: comentario || null }),
  })
}

export function editarCalificacion(idCalificacion, puntuacion, comentario) {
  return request(`/api/calificaciones/${idCalificacion}`, {
    method: 'PUT',
    body: JSON.stringify({ puntuacion, comentario: comentario || null }),
  })
}

export { API_URL }

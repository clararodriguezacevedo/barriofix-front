import { config } from '../config'

// Tokens de Cognito en localStorage. Se mandan el ID token a la API (lleva
// email y cognito:username). El client de Cognito tiene secret, asi que el
// browser NO puede refrescar solo: cuando el token vence, se vuelve a pasar por
// la Hosted UI (re-autentica sin pedir credenciales si la sesion sigue viva).
const ID_KEY = 'barriofix_id_token'
const ACCESS_KEY = 'barriofix_access_token'
const REFRESH_KEY = 'barriofix_refresh_token'

export function getToken() {
  try {
    return window.localStorage.getItem(ID_KEY)
  } catch {
    return null
  }
}

function guardarTokens({ id_token, access_token, refresh_token }) {
  try {
    if (id_token) window.localStorage.setItem(ID_KEY, id_token)
    if (access_token) window.localStorage.setItem(ACCESS_KEY, access_token)
    if (refresh_token) window.localStorage.setItem(REFRESH_KEY, refresh_token)
  } catch {
    // storage bloqueado: la sesion dura lo que dure la pestaña
  }
}

export function limpiarTokens() {
  try {
    ;[ID_KEY, ACCESS_KEY, REFRESH_KEY].forEach((k) => window.localStorage.removeItem(k))
  } catch {
    // nada
  }
}

// ------------------------------------------------------------ Hosted UI

/** URL de la Hosted UI de Cognito (login + registro). El front redirige aca y
 *  Cognito vuelve por /callback (API Gateway), que deja los tokens en el
 *  fragment. `state` sirve para prevenir CSRF: se guarda y se compara al volver. */
export function loginUrl() {
  const state = Math.random().toString(36).slice(2)
  try {
    window.sessionStorage.setItem('barriofix_oauth_state', state)
  } catch {
    // sin sessionStorage no validamos state, pero el login igual funciona
  }
  const params = new URLSearchParams({
    client_id: config.cognitoClientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: `${config.apiUrl}/callback`,
    state,
  })
  return `https://${config.cognitoDomain}/login?${params.toString()}`
}

/** Lee los tokens del fragment (#id_token=...&state=...) cuando volvemos del
 *  callback, los guarda y limpia la URL. Devuelve true si habia tokens. */
export function leerTokensDeLaUrl() {
  const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : ''
  if (!hash) return false
  const p = new URLSearchParams(hash)
  const id_token = p.get('id_token')
  if (!id_token) return false

  const esperado = (() => {
    try {
      return window.sessionStorage.getItem('barriofix_oauth_state')
    } catch {
      return null
    }
  })()
  // Si guardamos un state, tiene que coincidir (proteccion CSRF).
  if (esperado && p.get('state') && p.get('state') !== esperado) return false

  guardarTokens({
    id_token,
    access_token: p.get('access_token'),
    refresh_token: p.get('refresh_token'),
  })
  // Limpiar el fragment para no dejar los tokens en la URL ni en el historial.
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return true
}

// ------------------------------------------------------- sesion vencida

const SESION_VENCIDA = 'barriofix:sesion-vencida'

export function onSesionVencida(handler) {
  window.addEventListener(SESION_VENCIDA, handler)
  return () => window.removeEventListener(SESION_VENCIDA, handler)
}

// ---------------------------------------------------------------- fetch

async function request(path, { auth = true, ...options } = {}) {
  const headers = { ...options.headers }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${config.apiUrl}${path}`, { ...options, headers })

  if (res.status === 401 && auth) {
    limpiarTokens()
    window.dispatchEvent(new CustomEvent(SESION_VENCIDA))
    const err = new Error('Tu sesion vencio. Ingresa de nuevo.')
    err.status = 401
    throw err
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(mensajeDeError(body, res))
    err.status = res.status
    throw err
  }

  if (res.status === 204) return null
  return res.json()
}

/** Powertools devuelve el error en `message` (o `detail` segun el caso). */
function mensajeDeError(body, res) {
  const detail = body?.detail ?? body?.message
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

/** Crea el perfil en DynamoDB para una cuenta ya registrada en Cognito. El sub
 *  y el email salen del token; aca solo van los datos de perfil. */
export function registro(payload) {
  return request('/api/auth/registro', { method: 'POST', body: JSON.stringify(payload) })
}

export function fetchMe() {
  return request('/api/auth/me')
}

// ---------------------------------------------------------------- catalogos (publicos)

export function fetchCategorias() {
  return request('/api/categorias?activo=true', { auth: false })
}

export function fetchZonas() {
  return request('/api/zonas?activo=true', { auth: false })
}

export function fetchUrgencias() {
  return request('/api/urgencias?activo=true', { auth: false })
}

// ---------------------------------------------------------------- solicitudes

/** Devuelve { items, cursor }. Los callers usan .items (y .cursor si paginan). */
export function fetchSolicitudes(filtros = {}) {
  return request(`/api/solicitudes${qs(filtros)}`)
}

export function crearSolicitud(payload) {
  return request('/api/solicitudes', { method: 'POST', body: JSON.stringify(payload) })
}

export function fetchSeguimiento(id) {
  return request(`/api/solicitudes/${id}/seguimiento`)
}

export function aceptarSolicitud(id, motivo) {
  return request(`/api/solicitudes/${id}/aceptar`, { method: 'POST', body: JSON.stringify({ motivo: motivo ?? null }) })
}

export function iniciarSolicitud(id, motivo) {
  return request(`/api/solicitudes/${id}/iniciar`, { method: 'POST', body: JSON.stringify({ motivo: motivo ?? null }) })
}

export function resolverSolicitud(id, motivo) {
  return request(`/api/solicitudes/${id}/resolver`, { method: 'POST', body: JSON.stringify({ motivo: motivo ?? null }) })
}

export function liberarSolicitud(id, motivo) {
  return request(`/api/solicitudes/${id}/liberar`, { method: 'POST', body: JSON.stringify({ motivo: motivo ?? null }) })
}

export function cancelarSolicitud(id, motivo) {
  return request(`/api/solicitudes/${id}/cancelar`, { method: 'POST', body: JSON.stringify({ motivo: motivo ?? null }) })
}

/** Devuelve { items, cursor }. */
export function fetchTrabajos(filtros = {}) {
  return request(`/api/trabajos${qs(filtros)}`)
}

// ---------------------------------------------------------------- fotos

export function fetchFotos(idSolicitud) {
  return request(`/api/solicitudes/${idSolicitud}/fotos`)
}

/** Sube una foto en dos pasos: 1) pide al backend una URL prefirmada, 2) sube
 *  el archivo directo a S3 (no pasa por API Gateway ni Lambda). El tipo
 *  (ANTES/DESPUES) lo decide el backend segun el rol. */
export async function subirFoto(idSolicitud, archivo) {
  const { upload } = await request(`/api/solicitudes/${idSolicitud}/fotos`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  const form = new FormData()
  Object.entries(upload.fields).forEach(([k, v]) => form.append(k, v))
  form.append('Content-Type', archivo.type || 'image/jpeg')
  form.append('file', archivo) // el archivo va ULTIMO en un POST a S3
  const res = await fetch(upload.url, { method: 'POST', body: form })
  if (!res.ok) throw new Error('No se pudo subir la foto a S3')
}

// ---------------------------------------------------------------- calificaciones

export function calificar(idSolicitud, puntuacion, comentario) {
  return request(`/api/solicitudes/${idSolicitud}/calificacion`, {
    method: 'POST',
    body: JSON.stringify({ puntuacion, comentario: comentario || null }),
  })
}

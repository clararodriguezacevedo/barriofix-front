const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `${res.status} ${res.statusText}`)
  }
  if (res.status === 204) return null
  return res.json()
}

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v)
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries).toString()
}

export function fetchRequests({ categoria, estado } = {}) {
  return request(`/api/requests${qs({ categoria, estado })}`)
}

export function createRequest(payload) {
  return request('/api/requests', { method: 'POST', body: JSON.stringify(payload) })
}

export function acceptRequest(id, profesional) {
  return request(`/api/requests/${id}/accept`, {
    method: 'PATCH',
    body: JSON.stringify({ profesional }),
  })
}

export function updateRequestStatus(id, estado) {
  return request(`/api/requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

export function rateRequestApi(id, rating, comentario) {
  return request(`/api/requests/${id}/rate`, {
    method: 'POST',
    body: JSON.stringify({ rating, comentario }),
  })
}

export function fetchJobs({ categoria, urgencia } = {}) {
  return request(`/api/jobs${qs({ categoria, urgencia })}`)
}

export function fetchMedia(prefix = '') {
  return request(`/api/media${qs({ prefix })}`)
}

export function mediaUrl(key) {
  return `${API_URL}/api/media/${encodeURIComponent(key)}`
}

export { API_URL }

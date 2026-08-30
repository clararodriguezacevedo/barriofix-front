import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { SEED_REQUESTS, STATUS } from '../data/mockData'

const STORAGE_KEY = 'barriofix_requests'
const RequestsContext = createContext(null)

function loadInitial() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupted storage and fall back to seed data
  }
  return SEED_REQUESTS
}

function nextId(requests) {
  const max = requests.reduce((acc, r) => {
    const n = Number(r.id.replace('BF-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 1000)
  return `BF-${max + 1}`
}

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState(loadInitial)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  }, [requests])

  const api = useMemo(
    () => ({
      requests,
      addRequest(data) {
        const id = nextId(requests)
        const nueva = {
          id,
          estado: STATUS.PENDIENTE,
          profesional: null,
          rating: null,
          comentario: '',
          creado: new Date().toISOString().slice(0, 10),
          ...data,
        }
        setRequests((prev) => [nueva, ...prev])
        return id
      },
      takeJob(id, profesional) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, estado: STATUS.EN_PROGRESO, profesional } : r,
          ),
        )
      },
      completeJob(id) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, estado: STATUS.COMPLETADO } : r)),
        )
      },
      rateRequest(id, rating, comentario) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, rating, comentario } : r)),
        )
      },
    }),
    [requests],
  )

  return <RequestsContext.Provider value={api}>{children}</RequestsContext.Provider>
}

export function useRequests() {
  const ctx = useContext(RequestsContext)
  if (!ctx) throw new Error('useRequests debe usarse dentro de RequestsProvider')
  return ctx
}

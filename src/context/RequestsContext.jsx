import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  fetchRequests,
  createRequest,
  acceptRequest,
  updateRequestStatus,
  rateRequestApi,
} from '../api/client'
import { STATUS } from '../data/mockData'

const RequestsContext = createContext(null)

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      setRequests(await fetchRequests())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  function upsert(updated) {
    setRequests((prev) => {
      const exists = prev.some((r) => r.id === updated.id)
      return exists ? prev.map((r) => (r.id === updated.id ? updated : r)) : [updated, ...prev]
    })
  }

  const api = useMemo(
    () => ({
      requests,
      loading,
      error,
      reload,
      async addRequest(data) {
        try {
          const nueva = await createRequest(data)
          upsert(nueva)
          return nueva.id
        } catch (e) {
          setError(e.message)
          throw e
        }
      },
      async takeJob(id, profesional) {
        try {
          upsert(await acceptRequest(id, profesional))
        } catch (e) {
          setError(e.message)
        }
      },
      async completeJob(id) {
        try {
          upsert(await updateRequestStatus(id, STATUS.COMPLETADO))
        } catch (e) {
          setError(e.message)
        }
      },
      async rateRequest(id, rating, comentario) {
        try {
          upsert(await rateRequestApi(id, rating, comentario))
        } catch (e) {
          setError(e.message)
        }
      },
    }),
    [requests, loading, error],
  )

  return <RequestsContext.Provider value={api}>{children}</RequestsContext.Provider>
}

export function useRequests() {
  const ctx = useContext(RequestsContext)
  if (!ctx) throw new Error('useRequests debe usarse dentro de RequestsProvider')
  return ctx
}

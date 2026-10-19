import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  aceptarSolicitud,
  calificar as calificarApi,
  cancelarSolicitud,
  crearSolicitud,
  fetchSolicitudes,
  iniciarSolicitud,
  liberarSolicitud,
  resolverSolicitud,
} from '../api/client'
import { useAuth } from './AuthContext'

const SolicitudesContext = createContext(null)

export function SolicitudesProvider({ children }) {
  const { autenticado } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const recargar = useCallback(async () => {
    if (!autenticado) {
      setSolicitudes([])
      return
    }
    setCargando(true)
    setError(null)
    try {
      const { items } = await fetchSolicitudes()
      setSolicitudes(items)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [autenticado])

  useEffect(() => {
    recargar()
  }, [recargar])

  /** Todos los endpoints de mutación devuelven la solicitud completa y
   *  actualizada, así que la metemos directo en el estado local en vez de
   *  volver a pedir la lista entera. */
  function upsert(actualizada) {
    setSolicitudes((prev) => {
      const existe = prev.some((s) => s.id_solicitud === actualizada.id_solicitud)
      return existe
        ? prev.map((s) => (s.id_solicitud === actualizada.id_solicitud ? actualizada : s))
        : [actualizada, ...prev]
    })
    return actualizada
  }

  const valor = useMemo(
    () => ({
      solicitudes,
      cargando,
      error,
      recargar,
      limpiarError: () => setError(null),

      async crear(payload) {
        return upsert(await crearSolicitud(payload))
      },
      async aceptar(id, motivo) {
        return upsert(await aceptarSolicitud(id, motivo))
      },
      async iniciar(id, motivo) {
        return upsert(await iniciarSolicitud(id, motivo))
      },
      async resolver(id, motivo) {
        return upsert(await resolverSolicitud(id, motivo))
      },
      async liberar(id, motivo) {
        return upsert(await liberarSolicitud(id, motivo))
      },
      async cancelar(id, motivo) {
        return upsert(await cancelarSolicitud(id, motivo))
      },
      async calificar(id, puntuacion, comentario) {
        const calificacion = await calificarApi(id, puntuacion, comentario)
        setSolicitudes((prev) =>
          prev.map((s) => (s.id_solicitud === id ? { ...s, calificacion } : s)),
        )
        return calificacion
      },
    }),
    [solicitudes, cargando, error, recargar],
  )

  return <SolicitudesContext.Provider value={valor}>{children}</SolicitudesContext.Provider>
}

export function useSolicitudes() {
  const ctx = useContext(SolicitudesContext)
  if (!ctx) throw new Error('useSolicitudes debe usarse dentro de SolicitudesProvider')
  return ctx
}

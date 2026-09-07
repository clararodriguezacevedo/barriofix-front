import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCategorias, fetchUrgencias, fetchZonas } from '../api/client'

const CatalogosContext = createContext(null)

/**
 * Categorías, zonas y urgencias salen de la base, no de constantes hardcodeadas.
 * Se cargan una sola vez al arrancar: son endpoints públicos, así que están
 * disponibles incluso en el formulario de registro, antes de que haya token.
 */
export function CatalogosProvider({ children }) {
  const [categorias, setCategorias] = useState([])
  const [zonas, setZonas] = useState([])
  const [urgencias, setUrgencias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let vivo = true
    Promise.all([fetchCategorias(), fetchZonas(), fetchUrgencias()])
      .then(([cats, zs, urgs]) => {
        if (!vivo) return
        setCategorias(cats)
        setZonas(zs)
        // El backend ya las devuelve por orden_prioridad, pero lo dejamos
        // explícito para que el orden no dependa del endpoint.
        setUrgencias([...urgs].sort((a, b) => a.orden_prioridad - b.orden_prioridad))
      })
      .catch((e) => vivo && setError(e.message))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [])

  const valor = useMemo(() => {
    const porId = (lista, campo) => Object.fromEntries(lista.map((x) => [x[campo], x]))
    return {
      categorias,
      zonas,
      urgencias,
      cargando,
      error,
      categoriaPorId: porId(categorias, 'id_categoria'),
      zonaPorId: porId(zonas, 'id_zona'),
      urgenciaPorId: porId(urgencias, 'id_urgencia'),
    }
  }, [categorias, zonas, urgencias, cargando, error])

  return <CatalogosContext.Provider value={valor}>{children}</CatalogosContext.Provider>
}

export function useCatalogos() {
  const ctx = useContext(CatalogosContext)
  if (!ctx) throw new Error('useCatalogos debe usarse dentro de CatalogosProvider')
  return ctx
}

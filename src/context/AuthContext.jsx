import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  fetchMe,
  getToken,
  leerTokensDeLaUrl,
  limpiarTokens,
  loginUrl,
  onSesionVencida,
  registro as registroApi,
} from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  // La cuenta existe en Cognito pero todavia no cargo su perfil en DynamoDB:
  // hay que mostrar el formulario para completarlo.
  const [necesitaPerfil, setNecesitaPerfil] = useState(false)
  const [cargando, setCargando] = useState(true)

  const logout = useCallback(() => {
    limpiarTokens()
    setUsuario(null)
    setNecesitaPerfil(false)
  }, [])

  useEffect(() => onSesionVencida(logout), [logout])

  useEffect(() => {
    // Primero: si volvemos del callback de Cognito, tomar los tokens del fragment.
    leerTokensDeLaUrl()

    if (!getToken()) {
      setCargando(false)
      return
    }
    fetchMe()
      .then((yo) => setUsuario(yo))
      .catch((e) => {
        if (e.status === 404) {
          // Autenticado en Cognito pero sin perfil: a completar el registro.
          setNecesitaPerfil(true)
        } else {
          logout()
        }
      })
      .finally(() => setCargando(false))
  }, [logout])

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      necesitaPerfil,
      autenticado: Boolean(usuario),
      esCliente: Boolean(usuario?.es_cliente),
      esProfesional: Boolean(usuario?.es_profesional),
      esAdmin: Boolean(usuario?.es_admin),

      /** Redirige a la Hosted UI de Cognito (login y registro en un solo lugar). */
      login() {
        window.location.assign(loginUrl())
      },

      /** Completa el perfil en DynamoDB tras el alta en Cognito. */
      async registro(payload) {
        await registroApi(payload)
        const yo = await fetchMe()
        setUsuario(yo)
        setNecesitaPerfil(false)
        return yo
      },

      async refrescar() {
        const yo = await fetchMe()
        setUsuario(yo)
        return yo
      },

      logout,
    }),
    [usuario, cargando, necesitaPerfil, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

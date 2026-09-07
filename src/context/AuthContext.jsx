import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  fetchMe,
  getToken,
  login as loginApi,
  onSesionVencida,
  registro as registroApi,
  setToken,
} from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  // Arranca en true si hay token guardado: hay que validarlo contra el backend
  // antes de dibujar nada, o las rutas protegidas parpadean hacia /ingreso.
  const [cargando, setCargando] = useState(Boolean(getToken()))

  const logout = useCallback(() => {
    setToken(null)
    setUsuario(null)
  }, [])

  // El token puede haber vencido mientras la pestaña estaba abierta. El client
  // avisa con un evento y acá cerramos la sesión una sola vez, en lugar de que
  // cada pantalla maneje su propio 401.
  useEffect(() => onSesionVencida(logout), [logout])

  useEffect(() => {
    if (!getToken()) {
      setCargando(false)
      return
    }
    fetchMe()
      .then(setUsuario)
      .catch(() => logout())
      .finally(() => setCargando(false))
  }, [logout])

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      autenticado: Boolean(usuario),
      esCliente: Boolean(usuario?.es_cliente),
      esProfesional: Boolean(usuario?.es_profesional),
      esAdmin: Boolean(usuario?.es_admin),

      async login(username, password) {
        const data = await loginApi(username, password)
        setToken(data.access_token)
        setUsuario(data.usuario)
        return data.usuario
      },

      async registro(payload) {
        const data = await registroApi(payload)
        setToken(data.access_token)
        setUsuario(data.usuario)
        return data.usuario
      },

      /** Se llama después de darse de alta como profesional, para que la app
       *  vea el rol nuevo sin obligar a volver a entrar. */
      async refrescar() {
        const yo = await fetchMe()
        setUsuario(yo)
        return yo
      },

      logout,
    }),
    [usuario, cargando, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

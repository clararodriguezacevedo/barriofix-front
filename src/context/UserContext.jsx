import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'barriofix_user'
const UserContext = createContext(null)

function loadInitial() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupted storage
  }
  return null
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(loadInitial)

  useEffect(() => {
    if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else window.localStorage.removeItem(STORAGE_KEY)
  }, [user])

  return (
    <UserContext.Provider value={{ user, setUser, logout: () => setUser(null) }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser debe usarse dentro de UserProvider')
  return ctx
}

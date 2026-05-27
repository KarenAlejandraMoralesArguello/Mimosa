import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'mimosa_demo_user'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(load)

  const login = useCallback((u) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

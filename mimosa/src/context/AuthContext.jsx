import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // `user` tiene la forma: { id, email, role, name, banned, ... }
  // null = no autenticado, 'loading' = esperando sesión inicial de Supabase
  const [user, setUser] = useState('loading')

  // Dado un objeto Session de Supabase, carga el perfil de la tabla `perfiles`
  // y lo fusiona con los datos de la sesión.
  const loadProfile = useCallback(async (session) => {
    if (!session) { setUser(null); return }

    const { data, error } = await supabase
      .from('perfiles')
      .select('id, rol, nombre, email, banned, ban_reason')
      .eq('id', session.user.id)
      .single()

    if (error || !data) { setUser(null); return }

    setUser({
      id:        data.id,
      email:     data.email,
      role:      data.rol,       // 'brand' | 'creator' | 'admin'
      name:      data.nombre,
      banned:    data.banned,
      banReason: data.ban_reason,
    })
  }, [])

  // Al montar: recupera sesión activa y suscribe a cambios de auth.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session)
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  // login: usado después de signIn para forzar recarga del perfil.
  // Las páginas pueden llamarlo directamente o dejar que onAuthStateChange lo haga.
  const login = useCallback(async (session) => {
    await loadProfile(session)
  }, [loadProfile])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  // Actualiza campos locales del usuario sin recargar desde DB
  // (útil para cambios de nombre/plan en Account.jsx).
  const patchUser = useCallback((patch) => {
    setUser((prev) => prev && prev !== 'loading' ? { ...prev, ...patch } : prev)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, patchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

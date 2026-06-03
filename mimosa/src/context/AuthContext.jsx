import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// ─────────────────────────────────────────────────────────────────────────────
// AuthContext — gestión de sesión JWT con Supabase Auth
//
// Seguridad en capas:
//   1. Supabase emite JWTs firmados (HS256) con tiempo de expiración (1 hora).
//   2. El cliente los renueva automáticamente mediante refresh tokens.
//   3. onAuthStateChange captura SIGNED_OUT cuando la renovación falla
//      (token expirado, revocado o usuario eliminado) y limpia el estado local.
//   4. Cada solicitud a Supabase incluye el JWT en el header Authorization;
//      RLS rechaza cualquier request con token inválido o ausente — la
//      seguridad real vive en la base de datos, no solo en el frontend.
//   5. El componente ProtectedRoute (App.jsx) bloquea el acceso a rutas
//      privadas mientras el estado sea 'loading' o el usuario sea null/banned.
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

// Extrae y normaliza el perfil de la tabla `perfiles` para el estado local.
async function fetchProfile(session) {
  if (!session) return null

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, rol, nombre, email, banned, ban_reason')
    .eq('id', session.user.id)
    .single()

  if (error || !data) return null

  return {
    id:         data.id,
    email:      data.email,
    role:       data.rol,       // 'brand' | 'creator' | 'admin'
    name:       data.nombre,
    banned:     data.banned,
    banReason:  data.ban_reason,
    // Metadatos del JWT — útiles para auditoría
    jwtIssuedAt: session.user.aud,
    sessionId:   session.access_token?.slice(-8), // últimos 8 chars para debug
  }
}

export function AuthProvider({ children }) {
  // null     → no autenticado
  // 'loading' → esperando sesión inicial (evita flash de redirect)
  const [user, setUser] = useState('loading')

  const loadProfile = useCallback(async (session) => {
    const profile = await fetchProfile(session)
    setUser(profile)           // null si sesión inválida
  }, [])

  useEffect(() => {
    if (!supabase) { setUser(null); return }

    // Carga sesión existente al montar (refresca el JWT si está próximo a expirar).
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session)
    })

    // Escucha todos los eventos de autenticación de Supabase.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
        case 'USER_UPDATED':
          loadProfile(session)
          break

        case 'TOKEN_REFRESHED':
          break

        case 'SIGNED_OUT':
          setUser(null)
          break

        default:
          break
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  // Suscripción Realtime: si el admin suspende al usuario mientras está logueado,
  // se cierra la sesión inmediatamente sin esperar a que recargue la página.
  useEffect(() => {
    if (!supabase || !user || user === 'loading') return

    const channel = supabase
      .channel(`ban-watch-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'perfiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new?.banned) {
            supabase.auth.signOut()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const login = useCallback(async (session) => {
    await loadProfile(session)
  }, [loadProfile])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    // onAuthStateChange disparará SIGNED_OUT y limpiará el estado.
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
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

// Hook de conveniencia para rutas que solo necesitan saber si hay sesión.
// Devuelve { user, isLoading, isAuthenticated }.
export function useSession() {
  const { user } = useAuth()
  return {
    user:            user === 'loading' ? null : user,
    isLoading:       user === 'loading',
    isAuthenticated: !!user && user !== 'loading' && !user.banned,
  }
}

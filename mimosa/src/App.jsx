import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import WhatsAppButton from './components/WhatsAppButton.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import StaffLogin from './pages/StaffLogin.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Account from './pages/Account.jsx'
import NotFound from './pages/NotFound.jsx'
import { Terms, Privacy } from './pages/Legal.jsx'
import BrandDashboard from './pages/BrandDashboard.jsx'
import CreatorDashboard from './pages/CreatorDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import CreatorProfile from './pages/CreatorProfile.jsx'

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — Middleware de autenticación y autorización
//
// Capas de verificación (en orden):
//   1. Sesión cargando  → spinner (evita flash de redirect prematuro)
//   2. Sin sesión JWT   → redirect a /login
//   3. Cuenta suspendida → redirect a /login
//   4. Rol incorrecto   → redirect al dashboard correcto para ese rol
//   5. Todo OK          → renderiza el children
//
// Nota: esta es la capa frontend. La seguridad real está en RLS (Supabase):
// incluso si alguien manipula el estado local, no puede leer ni escribir datos
// porque el JWT se valida en cada query del lado del servidor.
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_HOME = {
  brand:   '/marca',
  creator: '/creadora',
  admin:   '/admin',
}

function ProtectedRoute({ role, children }) {
  const { user } = useAuth()

  // 1. Sesión aún cargando — mostrar spinner mínimo
  if (user === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: '50%',
          border: '3px solid var(--line)',
          borderTopColor: 'var(--violeta)',
          animation: 'spin .7s linear infinite',
        }} />
      </div>
    )
  }

  // 2. Sin sesión activa (JWT inválido, expirado o no existe)
  if (!user) return <Navigate to="/login" replace />

  // 3. Cuenta suspendida por admin
  if (user.banned) return <Navigate to="/login" replace state={{ banned: true }} />

  // 4. Rol incorrecto para esta ruta
  if (role && user.role !== role) {
    const home = ROLE_HOME[user.role] ?? '/login'
    return <Navigate to={home} replace />
  }

  // 5. Autorizado
  return children
}

// Animación del spinner (se inyecta una vez en el <head> via style tag).
const spinStyle = document.createElement('style')
spinStyle.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'
document.head.appendChild(spinStyle)

export default function App() {
  return (
    <>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/"            element={<Landing />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/recuperar"   element={<ForgotPassword />} />
        <Route path="/restablecer" element={<ResetPassword />} />
        <Route path="/registro"    element={<Register />} />
        <Route path="/terminos"    element={<Terms />} />
        <Route path="/privacidad"  element={<Privacy />} />

        {/* Acceso interno — ruta no enlazada en ninguna pantalla pública */}
        <Route path="/acceso-staff" element={<StaffLogin />} />

        {/* Rutas protegidas por rol */}
        <Route path="/marca" element={
          <ProtectedRoute role="brand"><BrandDashboard /></ProtectedRoute>
        } />
        <Route path="/creadora" element={
          <ProtectedRoute role="creator"><CreatorDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />

        {/* Ruta protegida sin rol específico (cualquier usuario autenticado) */}
        <Route path="/cuenta" element={
          <ProtectedRoute><Account /></ProtectedRoute>
        } />

        {/* Perfil público de creadora — sin auth requerida */}
        <Route path="/c/:id" element={<CreatorProfile />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <WhatsAppButton />
    </>
  )
}

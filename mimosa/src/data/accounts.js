// "Tabla de perfiles" de demostración.
// En producción esto vive en Supabase (tabla `perfiles`): el rol se asigna
// del lado del servidor al registrarse y NUNCA es modificable por el cliente.
// El rol de admin solo se otorga manualmente desde la base de datos.
//
// Roles válidos: 'brand' | 'creator' | 'admin'

const KEY = 'mimosa_accounts'

// Cuentas semilla para la demo (en real: filas en la tabla `perfiles`).
const SEED = [
  { email: 'marca@demo.com', role: 'brand', name: 'Lumière Skincare', plan: 'starter', createdAt: '2026-03-12' },
  { email: 'creadora@demo.com', role: 'creator', name: 'Valentina Ríos', status: 'verificado', portfolio: 'https://www.behance.net/valeugc', createdAt: '2026-02-04' },
  // El admin NO se muestra en ninguna pantalla pública.
  { email: 'admin@demo.com', role: 'admin', name: 'Equipo Mimosa', createdAt: '2026-01-01' },
]

function stored() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}

function persist(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

// Devuelve TODAS las cuentas (semilla + registradas, sin duplicados por email).
export function listAll() {
  const reg = stored()
  const regEmails = new Set(reg.map((a) => a.email.toLowerCase()))
  const seedExtras = SEED.filter((s) => !regEmails.has(s.email.toLowerCase()))
  return [...seedExtras, ...reg]
}

export function findByEmail(email) {
  const e = (email || '').trim().toLowerCase()
  return listAll().find((a) => a.email.toLowerCase() === e) || null
}

export function registerAccount(account) {
  const e = account.email.trim().toLowerCase()
  // Mantenemos todas las demás cuentas registradas + la semilla, y reemplazamos solo esta.
  const reg = stored().filter((a) => a.email.toLowerCase() !== e)
  // Si está en la semilla, igual lo añadimos a registradas para que prevalezcan los datos nuevos.
  reg.push({ createdAt: new Date().toISOString().slice(0, 10), ...account })
  persist(reg)
  return account
}

// Actualiza campos de una cuenta existente (perfil, plan, portafolio, etc).
export function updateAccount(email, patch) {
  const e = email.trim().toLowerCase()
  const reg = stored()
  const idx = reg.findIndex((a) => a.email.toLowerCase() === e)
  if (idx >= 0) {
    reg[idx] = { ...reg[idx], ...patch }
  } else {
    const seedAcc = SEED.find((a) => a.email.toLowerCase() === e)
    if (!seedAcc) return null
    reg.push({ ...seedAcc, ...patch })
  }
  persist(reg)
  return findByEmail(email)
}

// Marca una cuenta como baneada (PRD §7.2). En producción esto lo hace
// solo el rol admin desde el panel, validado por RLS en el servidor.
export function banAccount(email, reason) {
  return updateAccount(email, { banned: true, banReason: reason || '', bannedAt: new Date().toISOString() })
}

export function unbanAccount(email) {
  return updateAccount(email, { banned: false, banReason: '', bannedAt: null })
}

// Cambio de contraseña (en producción: supabase.auth.updateUser({password})).
// En la demo no almacenamos contraseñas; este helper solo simula la llamada.
export function changePassword(email, _currentPwd, _newPwd) {
  return updateAccount(email, { passwordUpdatedAt: new Date().toISOString() })
}

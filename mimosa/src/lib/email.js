/**
 * Envía emails transaccionales via Edge Function send-email.
 * Silencia errores para que nunca rompan el flujo principal del usuario.
 */
import { supabase } from './supabase.js'

export async function sendEmail(type, to, data = {}) {
  if (!supabase || !to) return
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { type, to, data },
    })
    if (error) console.warn('[email]', type, error.message)
  } catch (e) {
    console.warn('[email] error silenciado:', e)
  }
}

// Edge Function: enviar-notificacion
// Envía un email cuando se inserta una notificación en la DB.
//
// Prerequisitos:
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
//   supabase secrets set FROM_EMAIL=noreply@mimosacolab.com
//
// Deploy:
//   supabase functions deploy enviar-notificacion
//
// Se llama desde NotificationBell.jsx al crear una notificación,
// o puede conectarse a un Database Webhook en Supabase.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_URL = 'https://mimosa-web.netlify.app'

// Iconos por tipo de notificación (para el email)
const TIPO_CONFIG: Record<string, { emoji: string; color: string }> = {
  nueva_postulacion:  { emoji: '👤', color: '#ff2d78' },
  nuevo_mensaje:      { emoji: '💬', color: '#7c3aff' },
  perfil_aprobado:    { emoji: '🎉', color: '#00c97a' },
  perfil_rechazado:   { emoji: '⚠️', color: '#ff5c00' },
  nueva_orden:        { emoji: '📦', color: '#7c3aff' },
  orden_en_curso:     { emoji: '⚙️', color: '#7c3aff' },
  contenido_entregado:{ emoji: '📹', color: '#ff2d78' },
  orden_completada:   { emoji: '💸', color: '#00c97a' },
  orden_cancelada:    { emoji: '❌', color: '#ff5c00' },
  creadora_pendiente: { emoji: '👤', color: '#7c3aff' },
  campana_pendiente:  { emoji: '📣', color: '#ff2d78' },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { email, nombre, titulo, cuerpo, link, tipo } = await req.json()

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM       = Deno.env.get('FROM_EMAIL') ?? 'noreply@mimosacolab.com'

    if (!RESEND_KEY) {
      console.warn('RESEND_API_KEY no configurada — email no enviado a', email)
      return new Response(JSON.stringify({ sent: false, reason: 'no_api_key' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const cfg = TIPO_CONFIG[tipo] ?? { emoji: '🔔', color: '#7c3aff' }
    const actionUrl = link ? `${APP_URL}${link}` : APP_URL

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f7f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7fb;padding:32px 16px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;max-width:100%;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#ff2d78,#7c3aff);padding:28px 32px;">
                  <span style="font-family:Georgia,serif;font-weight:800;font-size:22px;color:#fff;">Mimosa</span>
                  <span style="font-size:10px;letter-spacing:.2em;color:rgba(255,255,255,.8);margin-left:6px;">COLAB CLUB</span>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:32px;">
                  <div style="font-size:36px;margin-bottom:16px;">${cfg.emoji}</div>
                  <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a2e;">${titulo}</h2>
                  <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">${cuerpo}</p>
                  <a href="${actionUrl}" style="
                    display:inline-block;background:${cfg.color};color:#fff;
                    padding:13px 28px;border-radius:12px;text-decoration:none;
                    font-weight:700;font-size:14px;letter-spacing:.02em;
                  ">Ver en Mimosa →</a>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px 32px;border-top:1px solid #f0f0f5;">
                  <p style="margin:0;font-size:12px;color:#999;">
                    Mimosa Colab Club · <a href="mailto:hola@mimosacolab.com" style="color:#7c3aff;">hola@mimosacolab.com</a><br>
                    Recibes este correo porque tienes una cuenta activa en Mimosa.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: `${cfg.emoji} ${titulo} — Mimosa Colab Club`,
        html,
      }),
    })

    const resBody = await res.json()
    return new Response(JSON.stringify({ sent: res.ok, resend: resBody }), {
      status: res.ok ? 200 : 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

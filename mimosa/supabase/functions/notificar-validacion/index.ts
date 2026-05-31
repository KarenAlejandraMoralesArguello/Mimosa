// Edge Function: notificar-validacion
// Envía email a la creadora cuando su portafolio es aprobado o rechazado.
//
// Prerequisitos (ejecutar en Supabase CLI):
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
//   supabase secrets set FROM_EMAIL=noreply@mimosacolab.com
//
// Deploy:
//   supabase functions deploy notificar-validacion
//
// Llamada desde AdminDashboard:
//   await supabase.functions.invoke('notificar-validacion', {
//     body: { email, nombre, tipo: 'aprobado' | 'rechazado', feedback: '...' }
//   })

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { email, nombre, tipo, feedback } = await req.json()

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM       = Deno.env.get('FROM_EMAIL') ?? 'noreply@mimosacolab.com'

    if (!RESEND_KEY) {
      // Sin API key configurada: log y responde OK (no rompe el flujo del admin)
      console.warn('RESEND_API_KEY no configurada — email no enviado a', email)
      return new Response(JSON.stringify({ sent: false, reason: 'no_api_key' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const subject = tipo === 'aprobado'
      ? '¡Tu portafolio fue aprobado! 🎉 Bienvenida al club'
      : 'Tu portafolio necesita ajustes — Mimosa Colab Club'

    const html = tipo === 'aprobado'
      ? `
        <h2>¡Hola ${nombre}!</h2>
        <p>Tu portafolio fue <strong>aprobado</strong> por el equipo de Mimosa. 🎉</p>
        <p>Ya tienes acceso al marketplace. El siguiente paso es capturar tu <strong>CLABE</strong>
        en el módulo de Verificación Financiera para poder recibir tus pagos.</p>
        <a href="https://mimosa-web.netlify.app/creadora" style="
          display:inline-block;background:#ff2d78;color:#fff;padding:12px 24px;
          border-radius:10px;text-decoration:none;font-weight:bold;margin-top:12px
        ">Ir a mi panel</a>
        <p style="margin-top:24px;color:#888;font-size:13px">Mimosa Colab Club · hola@mimosacolab.com</p>
      `
      : `
        <h2>Hola ${nombre},</h2>
        <p>Revisamos tu portafolio y por el momento <strong>necesita algunos ajustes</strong>
        antes de poder aprobarlo.</p>
        <div style="background:#fff0f4;border:1px solid #ffb3cc;border-radius:10px;padding:16px;margin:16px 0">
          <strong style="color:#ff2d78">Feedback del equipo Mimosa:</strong>
          <p style="margin:8px 0 0">${feedback ?? 'Sin comentarios adicionales.'}</p>
        </div>
        <p>Actualiza tu portafolio con los cambios necesarios y haz clic en
        <strong>"Reenviar para validación"</strong> desde tu panel.</p>
        <a href="https://mimosa-web.netlify.app/creadora" style="
          display:inline-block;background:#7c3aff;color:#fff;padding:12px 24px;
          border-radius:10px;text-decoration:none;font-weight:bold;margin-top:12px
        ">Ir a mi panel</a>
        <p style="margin-top:24px;color:#888;font-size:13px">Mimosa Colab Club · hola@mimosacolab.com</p>
      `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ from: FROM, to: email, subject, html }),
    })

    const resBody = await res.json()
    return new Response(JSON.stringify({ sent: res.ok, resend: resBody }), {
      status:  res.ok ? 200 : 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

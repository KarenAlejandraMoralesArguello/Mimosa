import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const APP_URL = 'https://mimosa-web.netlify.app'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { videos, base, deadline, campana_id, creadora_id, marca_id, email_marca, nombre_marca } = await req.json()

    const base_mxn    = Number(base)
    const brand_pays  = Math.round(base_mxn * 1.15 * 100) / 100
    const creator_gets = Math.round(base_mxn * 0.95 * 100) / 100

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Crear orden en DB con status pendiente_pago
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .insert({
        campana_id:   campana_id  ?? null,
        marca_id,
        creadora_id:  creadora_id ?? null,
        videos:       Number(videos),
        base_mxn,
        brand_pays,
        creator_gets,
        status:       'pendiente_pago',
        deadline:     deadline     ?? null,
      })
      .select('id')
      .single()

    if (ordenError || !orden) {
      return new Response(JSON.stringify({ error: ordenError?.message ?? 'Error al crear la orden' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Reusar Stripe Customer si ya existe
    const { data: marca } = await supabase
      .from('marcas')
      .select('stripe_customer_id')
      .eq('perfil_id', marca_id)
      .single()

    let customerId = marca?.stripe_customer_id
    if (!customerId && email_marca) {
      const customer = await stripe.customers.create({
        email: email_marca,
        name:  nombre_marca ?? '',
        metadata: { supabase_user_id: marca_id },
      })
      customerId = customer.id
      await supabase.from('marcas').update({ stripe_customer_id: customerId }).eq('perfil_id', marca_id)
    }

    // Checkout Session de pago único (escrow)
    const sessionParams: any = {
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'mxn',
          unit_amount: Math.round(brand_pays * 100), // centavos
          product_data: {
            name:        `Orden Mimosa — ${videos} video(s)`,
            description: `Escrow de colaboración UGC. Base pactada: $${base_mxn.toLocaleString('es-MX')} MXN.`,
          },
        },
        quantity: 1,
      }],
      success_url: `${APP_URL}/marca?orden=pagada`,
      cancel_url:  `${APP_URL}/marca`,
      metadata: {
        type:     'orden',
        orden_id: orden.id,
        marca_id,
      },
      payment_intent_data: {
        metadata: {
          type:     'orden',
          orden_id: orden.id,
          marca_id,
        },
      },
    }

    if (customerId) sessionParams.customer = customerId

    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(JSON.stringify({ url: session.url, orden_id: orden.id }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const PRICES: Record<string, string> = {
  foru:    'price_1Tdjn67hbGg6GsVe6BKzi3nj',
  starter: 'price_1Tdjn67hbGg6GsVeZqQp0JfJ',
  pro:     'price_1Tdjn67hbGg6GsVeetBSNJLx',
}

const APP_URL = 'https://mimosa-web.netlify.app'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { plan, userId, email, nombre } = await req.json()

    if (!PRICES[plan]) {
      return new Response(JSON.stringify({ error: 'Plan inválido' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: marca } = await supabase
      .from('marcas')
      .select('stripe_customer_id')
      .eq('perfil_id', userId)
      .single()

    let customerId = marca?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: nombre,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id

      await supabase
        .from('marcas')
        .update({ stripe_customer_id: customerId })
        .eq('perfil_id', userId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      success_url: `${APP_URL}/marca?checkout=success`,
      cancel_url:  `${APP_URL}/registro?rol=marca&plan_cancelado=1`,
      metadata: { plan, supabase_user_id: userId },
      subscription_data: { metadata: { plan, supabase_user_id: userId } },
      allow_promotion_codes: true,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

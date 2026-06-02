import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    )
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { plan, supabase_user_id } = session.metadata ?? {}
    const subscriptionId = session.subscription as string

    if (!plan || !supabase_user_id) {
      return new Response('Missing metadata', { status: 400 })
    }

    await supabase
      .from('marcas')
      .update({ plan })
      .eq('perfil_id', supabase_user_id)

    await supabase.from('suscripciones').upsert(
      {
        marca_id:               supabase_user_id,
        plan,
        status:                 'active',
        stripe_subscription_id: subscriptionId,
        period_start:           new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' },
    )
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.supabase_user_id

    if (userId) {
      await supabase
        .from('marcas')
        .update({ plan: 'foru' })
        .eq('perfil_id', userId)

      await supabase
        .from('suscripciones')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', sub.id)
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const userId = (invoice as any).subscription_details?.metadata?.supabase_user_id

    if (userId) {
      await supabase
        .from('suscripciones')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', invoice.subscription as string)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

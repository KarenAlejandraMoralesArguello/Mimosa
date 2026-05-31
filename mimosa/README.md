# Mimosa Colab Club

Marketplace SaaS que conecta marcas con creadoras de contenido UGC.

---

## Correr el proyecto localmente

```bash
cd mimosa
npm install
npm run dev   # http://localhost:5173
```

---

## ✅ Completado

- Esquema Supabase (11 tablas + RLS + trigger de registro)
- Auth real: registro, login, logout, reset password
- Campañas reales (marcas crean y admin pre-aprueba)
- Postulaciones reales (creadoras aplican al marketplace)
- Validación de creadoras con feedback y reenvío
- Cuentas y baneo/desbaneo (admin)
- Órdenes reales con escrow (StoreContext → Supabase)
- Chat en tiempo real (Supabase Realtime + Storage)
- Estadísticas reales en dashboard de creadora
- Mobile responsive (navbar + overflow)
- JWT middleware (ProtectedRoute por rol)
- Validaciones de formularios (email, contraseña, campos obligatorios)
- Ojito para ver contraseñas en todos los formularios

---

## ⏳ Pendientes antes de producción

### 1. Reactivar confirmación de email en Supabase
Para desarrollo se desactivó **"Confirm email"** en:
> Supabase → Authentication → Providers → Email → **Confirm email: OFF**

**Reactivarlo antes de lanzar.** Sin esto cualquier persona puede registrarse sin verificar que el correo es suyo.

---

### 2. Hacer NOT NULL las FK de órdenes
Actualmente `campana_id` y `creadora_id` en la tabla `ordenes` son nullable (se hicieron así para demos). Antes de producción ejecutar en Supabase SQL Editor:

```sql
ALTER TABLE public.ordenes ALTER COLUMN campana_id  SET NOT NULL;
ALTER TABLE public.ordenes ALTER COLUMN creadora_id SET NOT NULL;
```

---

### 3. Pagos con Stripe (Fase 3 — requiere cuenta Stripe)

**Prerequisitos:**
- Crear cuenta en [dashboard.stripe.com](https://dashboard.stripe.com/register) (país: México)
- Crear los 3 productos en Stripe Product Catalog con sus precios en MXN:
  - Mimosa ForU → $499 MXN/mes
  - Mimosa Starter → $799 MXN/mes
  - Mimosa Pro → $1,199 MXN/mes
- Guardar los `Price IDs` (`price_...`) — se usan en el código

**Variables de entorno a agregar** en `.env.local` y en Netlify:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Webhooks a configurar** en Stripe → Developers → Webhooks:
- URL: `https://osuegsalghbkotxbqwnl.supabase.co/functions/v1/stripe-webhook`
- Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `payment_intent.succeeded`, `charge.dispute.created`, `payout.failed`

**Lo que falta implementar:**
- Edge Function `stripe-webhook` (valida firma + actualiza `suscripciones`)
- Stripe Checkout para los 3 planes en el registro de marcas
- Escrow de órdenes: Edge Functions `crear-orden`, `aprobar-orden`, `cancelar-orden`
- Stripe Connect para onboarding de creadoras y dispersión a CLABE

---

### 4. Emails transaccionales con Resend (requiere dominio propio)

**Prerequisitos:**
- Dominio propio (ej. `mimosacolab.com`) verificado en [resend.com](https://resend.com)
- Sin dominio propio solo se puede usar `onboarding@resend.dev` para pruebas (solo envía a tu propio correo)

**Pasos cuando tengas dominio:**
1. Crear cuenta en Resend (plan gratuito: 100 emails/día)
2. Verificar el dominio en Resend → Domains → Add Domain
3. Obtener la API Key en Resend → API Keys → Create
4. Instalar Supabase CLI: `npm install -g supabase && supabase login`
5. Guardar las claves en Supabase (nunca en el código):
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxx
   supabase secrets set FROM_EMAIL=noreply@mimosacolab.com
   ```
6. Desplegar la Edge Function ya creada:
   ```bash
   supabase functions deploy notificar-validacion
   ```

**Emails que se enviarán automáticamente:**
- ✅ Aprobación de creadora (Edge Function `notificar-validacion` ya creada)
- ✅ Rechazo con feedback (Edge Function `notificar-validacion` ya creada)
- ⏳ Bienvenida al registrarse
- ⏳ Orden creada (para creadora)
- ⏳ Entrega recibida (para marca)
- ⏳ Pago liberado (para creadora)

> Mientras no esté configurado el sistema funciona igual — el email simplemente no se envía.

---

## Variables de entorno requeridas

Crea un archivo `.env.local` en la raíz de `mimosa/`:

```
VITE_SUPABASE_URL=https://osuegsalghbkotxbqwnl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...   # se llena cuando se configure Stripe
```

En Netlify agregar las mismas variables en **Site settings → Environment variables**.

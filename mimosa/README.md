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
- Notificaciones in-app en tiempo real (campanita con badge, dropdown, marcar leídas)
- Edge Function `enviar-notificacion` deployada (activa con RESEND_API_KEY)

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

### 4. Emails de notificaciones con Resend (requiere API key)

La infraestructura de emails ya está construida y deployada:
- Edge Function `enviar-notificacion` — deployada en Supabase, lista para usar
- Se dispara automáticamente cada vez que llega una notificación nueva en tiempo real
- Cubre todos los eventos: postulante, mensaje, aprobación, orden, etc.

**Solo falta agregar la API key:**

1. Crear cuenta en [resend.com](https://resend.com) (plan gratuito: 3,000 emails/mes)
2. Verificar el dominio `mimosacolab.com` en Resend → Domains (o usar `onboarding@resend.dev` para pruebas)
3. Obtener la API Key en Resend → API Keys → Create
4. Agregar los secrets en Supabase → proyecto → **Edge Functions → Secrets**:
   ```
   RESEND_API_KEY = re_xxxxxxxxxxxxxxxx
   FROM_EMAIL     = noreply@mimosacolab.com
   ```

> Una vez agregada la key, los emails empiezan a llegar automáticamente sin ningún cambio de código.

**Emails que se envían:**
- Nueva postulante a una campaña (marca)
- Nuevo mensaje de chat (ambas partes)
- Perfil aprobado / necesita ajustes (creadora)
- Nueva orden recibida (creadora)
- Orden en curso / entregada / completada / cancelada (partes relevantes)
- Nueva creadora por validar (admin)
- Nueva campaña por revisar (admin)

---

## Variables de entorno requeridas

Copia el ejemplo y crea tu archivo local de variables de entorno:

```bash
cp .env.example .env.local
```

Luego edita `.env.local` con tus valores reales:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

En Netlify agrega las mismas variables en **Site settings → Environment variables**.

# Mimosa Colab Club

Marketplace SaaS que conecta marcas con creadoras de contenido UGC.

---

## Correr el proyecto localmente

```bash
npm install
npm run dev   # http://localhost:5173
```

---

## Pendientes antes de ir a producción

### ⚠️ Reactivar confirmación de email en Supabase

Para desarrollo se desactivó **"Confirm email"** en:
> Supabase → Authentication → Providers → Email → **Confirm email: OFF**

**Antes de lanzar a producción, reactivarlo.** Con esta opción desactivada cualquier persona puede registrarse sin verificar que el correo es suyo.

---

## Variables de entorno requeridas

Crea un archivo `.env.local` en la raíz de `mimosa/` con:

```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...   # se llena en Fase 3 (pagos)
```

En Netlify agregar las mismas variables en **Site settings → Environment variables**.

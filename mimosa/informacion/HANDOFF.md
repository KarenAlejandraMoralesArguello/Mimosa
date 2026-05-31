# Mimosa Colab Club — Documento de Handoff

> Para el siguiente equipo que tome el proyecto.
> Versión actual: **MVP Frontend completo (demo navegable, sin backend)**.

---

## 1. Contexto del producto

**Mimosa Colab Club** es un marketplace bifronte SaaS que conecta **marcas comerciales** con **creadoras de contenido UGC** (User Generated Content). El producto está descrito en detalle en el `Documento_Maestro_MVP_Mimosa_Detallado.pdf` (PRD oficial v1.0).

Resumen de la lógica de negocio:

- **Suscripción mensual obligatoria para marcas**: $499 ForU / $799 Starter / $1,199 Pro (MXN). Las creadoras no pagan suscripción.
- **Comisión 20% por colaboración**: 15% lo añade la marca en checkout, 5% se retiene del pago a la creadora.
- **Valor mínimo por video: $500 MXN** — validado en frontend y debe validarse en backend.
- **Escrow vía Stripe**: el capital se congela hasta aprobación del contenido.
- **Máximo 2 rondas de correcciones** por orden (PRD §7.1).
- **Validación humana** del portafolio de creadoras antes de habilitarlas (PRD §6.1).
- **RLS obligatorio** en Supabase para todo (PRD §3).
- **Facturación descentralizada**: Mimosa solo factura membresías y comisiones, no el trabajo creativo.

---

## 2. Stack tecnológico

### Frontend (ya implementado)
- **React 18** + **Vite 5** (build veloz, HMR).
- **React Router v6** para navegación SPA.
- **CSS puro con variables** (sin Tailwind, sin framework UI) respetando la paleta exacta del PRD.
- **Context API** para estado de auth y store de órdenes.
- **localStorage** como persistencia temporal (a reemplazar por Supabase).

### Backend (planeado, NO implementado)
- **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions).
- **Stripe + Stripe Connect** (suscripciones + escrow + dispersión a creadoras).
- **Netlify** para hosting del frontend (config ya lista: `netlify.toml` + `public/_redirects`).

---

## 3. Estructura del proyecto

```
mimosa/
├── HANDOFF.md                 ← este archivo
├── netlify.toml               ← config de deploy en Netlify
├── package.json
├── vite.config.js
├── index.html
├── public/
│   ├── favicon.svg
│   └── _redirects             ← fallback de SPA para Netlify
├── .claude/launch.json        ← config para preview local (Claude Code)
└── src/
    ├── main.jsx               ← entry point: providers + router
    ├── App.jsx                ← rutas + guard Protected
    ├── styles/
    │   ├── theme.css          ← paleta oficial + tokens (colores, gradientes, tipografías)
    │   └── app.css            ← todos los estilos de componentes y pantallas
    ├── context/
    │   ├── AuthContext.jsx    ← user en sesión (localStorage demo)
    │   └── StoreContext.jsx   ← órdenes + correcciones (a reemplazar por Supabase)
    ├── data/
    │   ├── accounts.js        ← "tabla de perfiles" mock (= tabla `perfiles` en Supabase)
    │   └── mock.js            ← campañas, postulantes, marketplace, planes, helpers de cálculo
    ├── components/
    │   ├── Logo.jsx
    │   ├── Navbar.jsx
    │   ├── Footer.jsx
    │   ├── DashboardShell.jsx ← layout sidebar + main de los dashboards
    │   ├── Modal.jsx
    │   ├── Icon.jsx           ← 25 íconos SVG inline (todo es SVG, NO emojis)
    │   ├── UrgentBanner.jsx   ← alerta naranja para órdenes <24h
    │   └── WhatsAppButton.jsx ← FAB de soporte (PRD §8)
    └── pages/
        ├── Landing.jsx
        ├── Login.jsx
        ├── Register.jsx       ← picker marca/creadora + 2 formularios
        ├── StaffLogin.jsx     ← acceso INTERNO en /acceso-staff (no enlazado)
        ├── ForgotPassword.jsx
        ├── ResetPassword.jsx
        ├── Account.jsx        ← Mi cuenta / ajustes (perfil, seguridad, plan, banco)
        ├── BrandDashboard.jsx
        ├── CreatorDashboard.jsx
        ├── AdminDashboard.jsx
        ├── Legal.jsx          ← exporta Terms y Privacy
        └── NotFound.jsx
```

---

## 4. Lo que ya está hecho (frontend MVP)

### 🟢 Pantallas públicas
| Ruta | Pantalla | Notas |
|---|---|---|
| `/` | Landing | Hero, "Cómo funciona" (4 pasos), Features, 3 Planes, Sección creadoras, Footer |
| `/login` | Login | Email + contraseña. **No expone rol ni admin.** |
| `/registro` | Picker marca/creadora | Sin query → muestra picker. `?rol=marca` → form marca. `?rol=creadora` → form creadora. |
| `/registro?rol=marca` | Registro de marca | Datos comerciales + selección de plan |
| `/registro?rol=creadora` | Registro de creadora | Datos + portafolio externo obligatorio → cuenta entra en "en_validacion" |
| `/recuperar` | Solicitar reset de contraseña | Mensaje genérico (anti user-enumeration) |
| `/restablecer?token=...` | Establecer nueva contraseña | Validaciones: 8+ chars, letras+números, coincidencia |
| `/terminos` | Términos y condiciones | 9 secciones derivadas del PRD |
| `/privacidad` | Aviso de privacidad | 7 secciones (RLS, CLABE encriptada, HTTPS, ARCO) |
| `/acceso-staff` | **Acceso interno admin** | Ruta secreta, NO enlazada desde ningún lado |
| `/cuenta` | Mi cuenta (logueado) | Perfil, seguridad, plan (marca), portafolio+CLABE (creadora) |
| `*` | 404 propio | Con la ruta intentada y enlaces de recuperación |

### 🟢 Dashboard de marca (`/marca`)
- **Banner urgente <24h** arriba cuando hay órdenes próximas a vencer.
- **Campañas**: 3 cards con estado, métricas y "Ver detalle" → modal con brief completo y desglose financiero.
- **Postulantes**: 3 cards con foto, propuesta, costo y total. Modal "Ver portafolio" + "Iniciar chat".
- **Chat**: mensajes con burbujas, adjuntos placeholder (5MB máx), panel lateral de resumen + botón "Crear orden".
- **Crear orden** (3 pasos): formulario → checkout Stripe simulado → confirmación. **Persistencia real** en localStorage vía StoreContext.
- **Órdenes & Escrow**: lista con estado, contador de correcciones, botones "Solicitar corrección" / "Aprobar y liberar". Al llegar a 2/2, cambia a "Marcar como fallida".

### 🟢 Dashboard de creadora (`/creadora`)
- **Banner urgente <24h** arriba.
- **Inicio**: si está "en_validacion" → tarjeta con timeline de proceso + botón para simular aprobación. Si está verificada → welcome banner + 4 stats.
- **Marketplace**: 18 campañas con **buscador**, **filtro por estilo**, **ordenamiento** y **paginación 6/página**. Modal "Aplicar" con mínimo $500 validado.
- **Mis órdenes**: lista con botón "Entregar contenido" (modal pide URL externa válida).
- **Verificación CLABE**: form con validación 18 dígitos + simulación de encriptación.

### 🟢 Dashboard admin (`/admin`)
- **Validar creadoras**: lista pendientes, aprobar / rechazar con feedback.
- **Pre-aprobar campañas**: lista pendientes, publicar / rechazar.
- **Arbitraje**: ver todas las órdenes con su estado y entregas para inspección.
- **Cuentas**: lista todas las cuentas con buscador + filtro por rol o suspendidas. **Suspender con motivo** o reactivar. **El login bloquea cuentas suspendidas.**

### 🟢 Decisiones técnicas/seguridad importantes
- **El rol NO se elige al login**. Se asigna al registrarse y se almacena en la cuenta. El login lo deriva.
- **El admin no aparece en login público**. Acceso por `/acceso-staff` (ruta secreta).
- **Todos los formularios usan `preventDefault`** — nada viaja por GET en URL.
- **Sin emojis** en todo el frontend. Hay un componente `Icon` con 25 SVGs.
- **Responsive verificado** en 1280 / 768 / 375. Sin overflow horizontal.
- **Validaciones en cliente** que el backend DEBE replicar: mínimo $500/video, CLABE 18 dígitos, password 8+ chars con letras y números, portafolio URL válida.

### 🟢 Cuentas demo (para probar el demo localmente)

| Rol | Correo | Contraseña |
|---|---|---|
| Marca | `marca@demo.com` | cualquiera (no se valida en demo) |
| Creadora | `creadora@demo.com` | cualquiera |
| Admin | `admin@demo.com` | cualquiera (entra por `/acceso-staff`) |

---

## 5. Cómo correr el proyecto localmente

```bash
# Requisitos: Node 18+
cd mimosa
npm install
npm run dev          # arranca en http://localhost:5173
npm run build        # build de producción → dist/
npm run preview      # preview del build
```

### Deploy en Netlify
- `netlify.toml` y `public/_redirects` ya configurados.
- Comando de build: `npm run build`
- Publish directory: `dist`
- Conecta el repo a Netlify → deploy automático en cada push.

---

## 6. Lo que falta — pequeños pulidos de frontend

Estos son trabajos rápidos (≤ 1 día cada uno) que cierran el demo pero no son bloqueantes para empezar el backend:

| # | Tarea | Por qué |
|---|---|---|
| 1 | **Empty states** en algunas pantallas | Si no hay campañas/postulantes, el dashboard queda en blanco. Agregar mensaje + CTA. |
| 2 | **Centro de notificaciones** (campanita en sidebar) | El PRD habla de notificaciones por email pero no hay un inbox dentro de la app. |
| 3 | **Perfil público de creadora navegable** | Hoy "Ver portafolio" abre un modal placeholder. Falta una página `/c/:handle` con perfil completo. |
| 4 | **Facturación CFDI** (página dummy de "Mis facturas") | Mencionada en PRD §5.3, no existe UI. |
| 5 | **Aplicar a campaña → postulación visible** | La creadora aplica desde marketplace pero la postulación no aparece en su panel. Debe wirearse al store. |
| 6 | **Listado de campañas con búsqueda/filtros** (lado marca) | Sólo hay 3 cards estáticas. Cuando haya muchas, se necesita lo mismo que en marketplace. |
| 7 | **Ilustraciones SVG** para empty states / hero de creadoras | Hoy es solo texto + cards. |

---

## 7. Lo grande que falta — Backend (4 fases)

### **Fase 1: Fundamentos de Supabase** (2-3 sesiones)
1. Crear proyecto en Supabase + configurar variables en Netlify (`VITE_MIMOSA_SUPABASE_URL`, `VITE_MIMOSA_SUPABASE_ANON_KEY`).
2. **Diseñar el esquema relacional** (sugerencia):
   - `perfiles` (id, auth_id, rol enum, nombre, email, banned, ban_reason, created_at)
   - `marcas` (perfil_id, nombre_comercial, plan, stripe_customer_id, trial_ends_at)
   - `creadoras` (perfil_id, portafolio_url, status enum [borrador, en_validacion, verificado, rechazado], clabe_enc, stripe_account_id, validation_feedback)
   - `suscripciones` (marca_id, plan, status, period_start, period_end, stripe_subscription_id)
   - `campañas` (id, marca_id, titulo, brief, estilo, duracion_seg, videos, presupuesto, status, deadline_hours, created_at)
   - `postulaciones` (campaña_id, creadora_id, propuesta, precio_video, created_at)
   - `chats` (id, campaña_id, marca_id, creadora_id, created_at)
   - `mensajes` (chat_id, from_perfil_id, texto, archivo_url, created_at)
   - `ordenes` (id, campaña_id, marca_id, creadora_id, videos, base_mxn, brand_pays, creator_gets, status enum, deadline, corrections_used, correction_note, delivery_url, stripe_payment_intent)
   - `correcciones` (orden_id, ronda, comentario, solicitada_at)
   - `feedback_validacion` (creadora_id, admin_id, mensaje, created_at)
3. **Escribir TODAS las políticas RLS**. Reglas mínimas:
   - Cada usuario solo lee/escribe filas donde `auth.uid()` coincide con `marca_id` o `creadora_id`.
   - Admin lee todo, pero no puede modificar pagos o campos financieros (solo ban/feedback).
   - Datos bancarios (`clabe_enc`) solo accesibles desde Edge Functions, NO desde cliente.
4. **Conectar Supabase Auth** al frontend reemplazando `accounts.js` y el mock de `AuthContext`.
5. **Storage** para archivos de referencia del chat con límite de 5MB (PRD §6.3) — validar tamaño Y tipo MIME server-side.

### **Fase 2: Flujos core reales** (2 sesiones)
1. **Validación de creadoras**: trigger de email automático al cambiar status.
2. **Verificación financiera**: integrar Stripe Connect onboarding.
3. **Campañas + Postulaciones**: queries reales, paginación server-side.
4. **Chat en tiempo real** con Supabase Realtime (channel por chat_id).
5. **Entregas**: registrar URL externa + cambio de estado.

### **Fase 3: Pagos (el corazón)** (3 sesiones)
1. **Suscripciones**: Stripe Checkout para los 3 planes + free trial. Webhook que actualice `suscripciones`.
2. **Escrow de órdenes**:
   - Edge Function `crear-orden` que validates min $500, crea row con status `pendiente_pago`, devuelve URL de Stripe Checkout.
   - Webhook `payment_intent.succeeded` → status `en_curso`, fondos congelados.
   - Edge Function `aprobar-orden` → Stripe transfer al stripe_account_id de la creadora.
   - Edge Function `cancelar-orden` → refund a la marca.
3. **Dispersión automática**: usar Stripe Connect Express con balance + payouts a CLABE.
4. **Webhooks adicionales**: `charge.dispute.created`, `payout.failed`, etc.

### **Fase 4: Gobernanza y polish** (1-2 sesiones)
1. **Sistema de baneo real** (ya hay UI, falta wirearlo a la DB con auditoría).
2. **Resolución de disputas** en admin (botones existen, falta lógica server-side).
3. **Emails transaccionales** (Resend / Postmark / SendGrid).
4. **Logs y observabilidad** (Sentry para errores, Posthog para producto).
5. **Tests** mínimos: e2e del flujo crítico (registro → publicar campaña → aplicar → chat → orden → escrow → entrega → aprobar).

---

## 8. Conceptos clave que el siguiente equipo DEBE respetar

1. **El cálculo financiero es exactamente 15/5/20** (PRD §5.1). El helper `quote()` en `src/data/mock.js` ya lo hace. NO redondear hacia arriba el cargo a la marca.
2. **Mínimo $500 MXN por video** se valida en frontend (`MIN_VIDEO_PRICE`). Replicarlo en backend con un check constraint en la columna.
3. **RLS desde el día 1**. Nunca crear una tabla sin política. Tests obligatorios: intentar leer chat de otra marca con tu sesión debe fallar.
4. **El rol admin se otorga manualmente desde la DB**. Nunca exponer endpoint público de "convertirme en admin".
5. **CLABE encriptada**, nunca en texto plano. Considerar `pgsodium` o que solo viva en Stripe Connect.
6. **Las contraseñas las maneja Supabase Auth** (bcrypt + JWT). NUNCA almacenarlas tú.
7. **Stripe webhooks deben validar la firma** (`stripe.webhooks.constructEvent`).
8. **No tocar la paleta** (`src/styles/theme.css`). Está alineada al 100% con el PRD §2.

---

## 9. Cosas conocidas que NO están perfectas (deuda técnica)

- El **mock de `accounts.js` no valida contraseñas**: cualquier password funciona para cuentas demo. Esto se resuelve solo al migrar a Supabase Auth.
- La **demo persiste todo en localStorage**. Si limpias el browser, vuelves al seed.
- **La marca seedeada en demo es siempre "Lumière Skincare"** en algunos textos hardcoded (subtítulo del dashboard). Cambiarlo cuando haya datos reales.
- **El chat no es realtime aún**: los mensajes son una array estática. Se resuelve en Fase 2 con Supabase Realtime.
- **El detalle de campaña no enlaza al chat de un postulante específico**: por ahora muestra info general. Mejorar al wirear data real.
- **Variables hardcoded de WhatsApp**: el número `520000000000` está en `WhatsAppButton.jsx` y `Footer.jsx`. Reemplazar por el real.
- **Sin tests automatizados**. Se verificó todo manualmente vía DOM queries en el navegador.

---

## 10. Próximos pasos sugeridos (orden recomendado)

1. **Día 1-2**: Leer todo el código, correr el demo, entender la lógica financiera y el flujo PRD.
2. **Día 3**: Crear proyecto Supabase, escribir el SQL del esquema y las políticas RLS. Subir a un repo.
3. **Día 4-5**: Migrar `AuthContext` y `accounts.js` a Supabase Auth. Probar registro/login real.
4. **Día 6-7**: Migrar `StoreContext` (órdenes) a queries Supabase. Aplicar RLS y probar con dos cuentas distintas.
5. **Día 8**: Storage para archivos del chat + Realtime para mensajes.
6. **Día 9-12**: Stripe — suscripciones primero, después escrow de órdenes.
7. **Día 13-14**: Emails transaccionales, deploy a producción, smoke tests.

Total estimado para llegar a producción: **2-3 semanas de un desarrollador full-time**, asumiendo experiencia con Supabase y Stripe.

---

## 11. Contactos / recursos

- **PRD oficial**: `Documento_Maestro_MVP_Mimosa_Detallado.pdf`
- **Stripe Connect (México)**: https://stripe.com/docs/connect/express-accounts
- **Supabase RLS docs**: https://supabase.com/docs/guides/auth/row-level-security
- **Netlify SPA redirects**: ya configurados en `_redirects` y `netlify.toml`

---

_Documento generado el 28 de mayo de 2026._
_Estado al cierre: frontend completo, listo para deploy en Netlify, backend pendiente._

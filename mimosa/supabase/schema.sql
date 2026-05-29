-- ============================================================
-- Mimosa Colab Club — Esquema Supabase
-- Ejecutar en el SQL Editor de Supabase en este orden.
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================
create extension if not exists "pgsodium";    -- para clabe_enc
create extension if not exists "pg_net";      -- para webhooks / Edge Functions

-- ============================================================
-- ENUMS
-- ============================================================
create type rol_perfil        as enum ('brand', 'creator', 'admin');
create type plan_marca        as enum ('foru', 'starter', 'pro');
create type status_creadora   as enum ('borrador', 'en_validacion', 'verificado', 'rechazado');
create type status_suscripcion as enum ('trialing', 'active', 'past_due', 'canceled');
create type status_campana    as enum ('borrador', 'pendiente', 'activa', 'cerrada', 'rechazada');
create type status_orden      as enum ('pendiente_pago', 'en_curso', 'entregado', 'completado', 'cancelado');

-- ============================================================
-- TABLA: perfiles
-- Espejo de auth.users — un row por usuario autenticado.
-- El rol se asigna en el INSERT del trigger y NUNCA es
-- modificable por el cliente (RLS lo impide).
-- ============================================================
create table public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  rol         rol_perfil  not null,
  nombre      text        not null check (char_length(nombre) between 1 and 120),
  email       text        not null unique,
  banned      boolean     not null default false,
  ban_reason  text,
  banned_at   timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.perfiles enable row level security;

-- Cada usuario lee su propio perfil; admin lee todos.
create policy "perfiles: lectura propia"
  on public.perfiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.rol = 'admin'
    )
  );

-- Nadie actualiza su propio rol o estado de baneo — solo admin.
create policy "perfiles: update propio (sin rol/ban)"
  on public.perfiles for update
  using (auth.uid() = id)
  with check (
    -- No puede cambiar su propio rol ni el estado de baneo
    rol = (select rol from public.perfiles where id = auth.uid())
    and banned = (select banned from public.perfiles where id = auth.uid())
  );

create policy "perfiles: admin update total"
  on public.perfiles for update
  using (
    exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.rol = 'admin'
    )
  );

-- El INSERT lo hace el trigger on_auth_user_created; no se permite desde cliente.
create policy "perfiles: sin insert directo"
  on public.perfiles for insert
  with check (false);

-- ============================================================
-- TABLA: marcas
-- ============================================================
create table public.marcas (
  perfil_id           uuid primary key references public.perfiles(id) on delete cascade,
  nombre_comercial    text        not null check (char_length(nombre_comercial) between 1 and 120),
  plan                plan_marca  not null default 'foru',
  stripe_customer_id  text unique,
  trial_ends_at       timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.marcas enable row level security;

create policy "marcas: lectura propia"
  on public.marcas for select
  using (auth.uid() = perfil_id);

create policy "marcas: admin lectura"
  on public.marcas for select
  using (
    exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

create policy "marcas: update propio (sin stripe_customer_id)"
  on public.marcas for update
  using (auth.uid() = perfil_id)
  with check (
    -- stripe_customer_id solo se actualiza desde Edge Functions (service_role)
    stripe_customer_id = (select stripe_customer_id from public.marcas where perfil_id = auth.uid())
  );

-- ============================================================
-- TABLA: creadoras
-- ============================================================
create table public.creadoras (
  perfil_id             uuid primary key references public.perfiles(id) on delete cascade,
  portafolio_url        text        not null check (portafolio_url ~ '^https?://'),
  status                status_creadora not null default 'borrador',
  clabe_enc             bytea,            -- encriptado con pgsodium; nunca en texto plano
  stripe_account_id     text unique,
  validation_feedback   text,
  created_at            timestamptz not null default now()
);

alter table public.creadoras enable row level security;

create policy "creadoras: lectura propia"
  on public.creadoras for select
  using (auth.uid() = perfil_id);

-- Marcas y admin pueden ver creadoras verificadas (para marketplace).
create policy "creadoras: lectura verificadas"
  on public.creadoras for select
  using (
    status = 'verificado'
    and exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.rol in ('brand', 'admin')
    )
  );

create policy "creadoras: update propio (sin status/clabe/stripe)"
  on public.creadoras for update
  using (auth.uid() = perfil_id)
  with check (
    -- La creadora solo puede cambiar portafolio_url; status y campos financieros son server-only
    status           = (select status           from public.creadoras where perfil_id = auth.uid())
    and clabe_enc    is not distinct from (select clabe_enc    from public.creadoras where perfil_id = auth.uid())
    and stripe_account_id is not distinct from (select stripe_account_id from public.creadoras where perfil_id = auth.uid())
  );

create policy "creadoras: admin update"
  on public.creadoras for update
  using (
    exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

-- ============================================================
-- TABLA: suscripciones
-- ============================================================
create table public.suscripciones (
  id                      uuid primary key default gen_random_uuid(),
  marca_id                uuid not null references public.marcas(perfil_id) on delete cascade,
  plan                    plan_marca not null,
  status                  status_suscripcion not null default 'trialing',
  period_start            timestamptz,
  period_end              timestamptz,
  stripe_subscription_id  text unique,
  created_at              timestamptz not null default now()
);

alter table public.suscripciones enable row level security;

create policy "suscripciones: lectura propia marca"
  on public.suscripciones for select
  using (auth.uid() = marca_id);

create policy "suscripciones: admin lectura"
  on public.suscripciones for select
  using (
    exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

-- Solo service_role (webhooks de Stripe) puede insertar/actualizar.

-- ============================================================
-- TABLA: campanas
-- ============================================================
create table public.campanas (
  id              uuid primary key default gen_random_uuid(),
  marca_id        uuid not null references public.marcas(perfil_id) on delete cascade,
  titulo          text not null check (char_length(titulo) between 3 and 200),
  brief           text,
  estilo          text,
  duracion_seg    integer check (duracion_seg > 0),
  videos          integer not null check (videos > 0),
  presupuesto     numeric(10,2) not null check (presupuesto >= 500),
  status          status_campana not null default 'borrador',
  deadline_hours  integer,
  created_at      timestamptz not null default now()
);

alter table public.campanas enable row level security;

-- Marca ve sus propias campañas.
create policy "campanas: lectura propia marca"
  on public.campanas for select
  using (auth.uid() = marca_id);

-- Creadoras verificadas ven campañas activas.
create policy "campanas: creadoras ven activas"
  on public.campanas for select
  using (
    status = 'activa'
    and exists (
      select 1 from public.creadoras c
      where c.perfil_id = auth.uid() and c.status = 'verificado'
    )
  );

-- Admin ve todas.
create policy "campanas: admin lectura"
  on public.campanas for select
  using (
    exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

create policy "campanas: marca insert"
  on public.campanas for insert
  with check (auth.uid() = marca_id);

create policy "campanas: marca update propias (solo borrador)"
  on public.campanas for update
  using (
    auth.uid() = marca_id
    and status = 'borrador'
  );

create policy "campanas: admin update"
  on public.campanas for update
  using (
    exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

-- ============================================================
-- TABLA: postulaciones
-- ============================================================
create table public.postulaciones (
  id              uuid primary key default gen_random_uuid(),
  campana_id      uuid not null references public.campanas(id) on delete cascade,
  creadora_id     uuid not null references public.creadoras(perfil_id) on delete cascade,
  propuesta       text,
  precio_video    numeric(10,2) not null check (precio_video >= 500), -- PRD §5.1 mínimo $500
  created_at      timestamptz not null default now(),
  unique (campana_id, creadora_id)
);

alter table public.postulaciones enable row level security;

-- Creadora ve sus propias postulaciones.
create policy "postulaciones: lectura creadora"
  on public.postulaciones for select
  using (auth.uid() = creadora_id);

-- Marca ve postulaciones de sus campañas.
create policy "postulaciones: lectura marca"
  on public.postulaciones for select
  using (
    exists (
      select 1 from public.campanas c
      where c.id = campana_id and c.marca_id = auth.uid()
    )
  );

create policy "postulaciones: admin lectura"
  on public.postulaciones for select
  using (
    exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

create policy "postulaciones: creadora insert"
  on public.postulaciones for insert
  with check (
    auth.uid() = creadora_id
    and exists (
      select 1 from public.creadoras c
      where c.perfil_id = auth.uid() and c.status = 'verificado'
    )
    and precio_video >= 500
  );

-- ============================================================
-- TABLA: chats
-- ============================================================
create table public.chats (
  id          uuid primary key default gen_random_uuid(),
  campana_id  uuid not null references public.campanas(id) on delete cascade,
  marca_id    uuid not null references public.marcas(perfil_id) on delete cascade,
  creadora_id uuid not null references public.creadoras(perfil_id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (campana_id, creadora_id)
);

alter table public.chats enable row level security;

create policy "chats: participantes"
  on public.chats for select
  using (auth.uid() = marca_id or auth.uid() = creadora_id);

create policy "chats: admin lectura"
  on public.chats for select
  using (
    exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

-- Solo marca puede abrir un chat (tras aceptar postulante).
create policy "chats: marca insert"
  on public.chats for insert
  with check (auth.uid() = marca_id);

-- ============================================================
-- TABLA: mensajes
-- ============================================================
create table public.mensajes (
  id              uuid primary key default gen_random_uuid(),
  chat_id         uuid not null references public.chats(id) on delete cascade,
  from_perfil_id  uuid not null references public.perfiles(id) on delete cascade,
  texto           text,
  archivo_url     text,   -- Storage URL (máx 5 MB validado en Edge Function)
  created_at      timestamptz not null default now(),
  check (texto is not null or archivo_url is not null)
);

alter table public.mensajes enable row level security;

create policy "mensajes: participantes del chat"
  on public.mensajes for select
  using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id
        and (c.marca_id = auth.uid() or c.creadora_id = auth.uid())
    )
  );

create policy "mensajes: insert participante"
  on public.mensajes for insert
  with check (
    auth.uid() = from_perfil_id
    and exists (
      select 1 from public.chats c
      where c.id = chat_id
        and (c.marca_id = auth.uid() or c.creadora_id = auth.uid())
    )
  );

-- ============================================================
-- TABLA: ordenes
-- ============================================================
create table public.ordenes (
  id                    uuid primary key default gen_random_uuid(),
  campana_id            uuid not null references public.campanas(id),
  marca_id              uuid not null references public.marcas(perfil_id),
  creadora_id           uuid not null references public.creadoras(perfil_id),
  videos                integer not null check (videos > 0),
  base_mxn              numeric(10,2) not null check (base_mxn >= 500),
  brand_pays            numeric(10,2) not null, -- base * 1.15
  creator_gets          numeric(10,2) not null, -- base * 0.95
  status                status_orden not null default 'pendiente_pago',
  deadline              date,
  corrections_used      integer not null default 0 check (corrections_used between 0 and 2),
  correction_note       text,
  delivery_url          text,
  stripe_payment_intent text unique,
  created_at            timestamptz not null default now(),
  -- Validar fórmula financiera PRD §5.1
  check (brand_pays  = round(base_mxn * 1.15, 2)),
  check (creator_gets = round(base_mxn * 0.95, 2))
);

alter table public.ordenes enable row level security;

create policy "ordenes: lectura marca"
  on public.ordenes for select
  using (auth.uid() = marca_id);

create policy "ordenes: lectura creadora"
  on public.ordenes for select
  using (auth.uid() = creadora_id);

create policy "ordenes: admin lectura"
  on public.ordenes for select
  using (
    exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

-- Creadora puede actualizar delivery_url y pasar a 'entregado'.
create policy "ordenes: creadora entrega"
  on public.ordenes for update
  using (
    auth.uid() = creadora_id
    and status = 'en_curso'
  )
  with check (
    status = 'entregado'
    and delivery_url is not null
    -- No puede tocar campos financieros ni de correcciones
    and brand_pays        = (select brand_pays        from public.ordenes where id = ordenes.id)
    and creator_gets      = (select creator_gets      from public.ordenes where id = ordenes.id)
    and corrections_used  = (select corrections_used  from public.ordenes where id = ordenes.id)
  );

-- Marca puede aprobar o solicitar corrección (gestionado en Edge Function).
-- Los updates financieros y de Stripe solo vienen de service_role.

-- ============================================================
-- TABLA: correcciones
-- ============================================================
create table public.correcciones (
  id            uuid primary key default gen_random_uuid(),
  orden_id      uuid not null references public.ordenes(id) on delete cascade,
  ronda         integer not null check (ronda between 1 and 2),
  comentario    text,
  solicitada_at timestamptz not null default now(),
  unique (orden_id, ronda)
);

alter table public.correcciones enable row level security;

create policy "correcciones: marca ve las suyas"
  on public.correcciones for select
  using (
    exists (
      select 1 from public.ordenes o
      where o.id = orden_id and o.marca_id = auth.uid()
    )
  );

create policy "correcciones: creadora ve las suyas"
  on public.correcciones for select
  using (
    exists (
      select 1 from public.ordenes o
      where o.id = orden_id and o.creadora_id = auth.uid()
    )
  );

create policy "correcciones: admin lectura"
  on public.correcciones for select
  using (
    exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

-- ============================================================
-- TABLA: feedback_validacion
-- Feedback del admin al rechazar o aprobar una creadora.
-- ============================================================
create table public.feedback_validacion (
  id           uuid primary key default gen_random_uuid(),
  creadora_id  uuid not null references public.creadoras(perfil_id) on delete cascade,
  admin_id     uuid not null references public.perfiles(id),
  mensaje      text not null,
  created_at   timestamptz not null default now()
);

alter table public.feedback_validacion enable row level security;

create policy "feedback_validacion: creadora lee el suyo"
  on public.feedback_validacion for select
  using (auth.uid() = creadora_id);

create policy "feedback_validacion: admin lee todo"
  on public.feedback_validacion for select
  using (
    exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

create policy "feedback_validacion: solo admin inserta"
  on public.feedback_validacion for insert
  with check (
    auth.uid() = admin_id
    and exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

-- ============================================================
-- TRIGGER: crear perfil al registrarse en Supabase Auth
-- Se ejecuta con SECURITY DEFINER (service_role) para poder
-- insertar en perfiles aunque RLS bloquee el insert al cliente.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, rol, nombre, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'rol')::rol_perfil, 'brand'),
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ÍNDICES de rendimiento
-- ============================================================
create index on public.campanas (marca_id);
create index on public.campanas (status);
create index on public.postulaciones (campana_id);
create index on public.postulaciones (creadora_id);
create index on public.chats (marca_id);
create index on public.chats (creadora_id);
create index on public.mensajes (chat_id, created_at);
create index on public.ordenes (marca_id);
create index on public.ordenes (creadora_id);
create index on public.ordenes (status);

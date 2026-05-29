-- ============================================================
-- FIX: Recursión infinita en políticas RLS de `perfiles`
-- El problema: las policies consultaban la tabla `perfiles`
-- para verificar el rol admin, dentro de una policy de la
-- misma tabla → loop infinito.
-- La solución: función SECURITY DEFINER que bypasea RLS.
-- ============================================================

-- 1. Función auxiliar que lee el rol del usuario actual
--    con SECURITY DEFINER (ejecuta como postgres, sin RLS).
create or replace function public.get_my_rol()
returns rol_perfil
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid()
$$;

-- 2. Eliminar las policies recursivas y recrearlas usando get_my_rol().

-- perfiles
drop policy if exists "perfiles: lectura propia"       on public.perfiles;
drop policy if exists "perfiles: update propio (sin rol/ban)" on public.perfiles;
drop policy if exists "perfiles: admin update total"   on public.perfiles;
drop policy if exists "perfiles: sin insert directo"   on public.perfiles;

create policy "perfiles: lectura propia"
  on public.perfiles for select
  using (auth.uid() = id or public.get_my_rol() = 'admin');

create policy "perfiles: update propio (sin rol/ban)"
  on public.perfiles for update
  using (auth.uid() = id and public.get_my_rol() != 'admin')
  with check (
    rol    = (select rol    from public.perfiles where id = auth.uid())
    and banned = (select banned from public.perfiles where id = auth.uid())
  );

create policy "perfiles: admin update total"
  on public.perfiles for update
  using (public.get_my_rol() = 'admin');

create policy "perfiles: sin insert directo"
  on public.perfiles for insert
  with check (false);

-- marcas
drop policy if exists "marcas: lectura propia"  on public.marcas;
drop policy if exists "marcas: admin lectura"   on public.marcas;
drop policy if exists "marcas: update propio (sin stripe_customer_id)" on public.marcas;

create policy "marcas: lectura propia"
  on public.marcas for select
  using (auth.uid() = perfil_id);

create policy "marcas: admin lectura"
  on public.marcas for select
  using (public.get_my_rol() = 'admin');

create policy "marcas: update propio (sin stripe_customer_id)"
  on public.marcas for update
  using (auth.uid() = perfil_id)
  with check (
    stripe_customer_id is not distinct from
    (select stripe_customer_id from public.marcas where perfil_id = auth.uid())
  );

create policy "marcas: insert propio"
  on public.marcas for insert
  with check (auth.uid() = perfil_id);

-- creadoras
drop policy if exists "creadoras: lectura propia"            on public.creadoras;
drop policy if exists "creadoras: lectura verificadas"       on public.creadoras;
drop policy if exists "creadoras: update propio (sin status/clabe/stripe)" on public.creadoras;
drop policy if exists "creadoras: admin update"              on public.creadoras;

create policy "creadoras: lectura propia"
  on public.creadoras for select
  using (auth.uid() = perfil_id);

create policy "creadoras: lectura verificadas"
  on public.creadoras for select
  using (
    status = 'verificado'
    and public.get_my_rol() in ('brand', 'admin')
  );

create policy "creadoras: update propio (sin status/clabe/stripe)"
  on public.creadoras for update
  using (auth.uid() = perfil_id)
  with check (
    status = (select status from public.creadoras where perfil_id = auth.uid())
    and clabe_enc is not distinct from (select clabe_enc from public.creadoras where perfil_id = auth.uid())
    and stripe_account_id is not distinct from (select stripe_account_id from public.creadoras where perfil_id = auth.uid())
  );

create policy "creadoras: admin update"
  on public.creadoras for update
  using (public.get_my_rol() = 'admin');

create policy "creadoras: insert propio"
  on public.creadoras for insert
  with check (auth.uid() = perfil_id);

-- suscripciones
drop policy if exists "suscripciones: lectura propia marca" on public.suscripciones;
drop policy if exists "suscripciones: admin lectura"        on public.suscripciones;

create policy "suscripciones: lectura propia marca"
  on public.suscripciones for select
  using (auth.uid() = marca_id);

create policy "suscripciones: admin lectura"
  on public.suscripciones for select
  using (public.get_my_rol() = 'admin');

-- campanas
drop policy if exists "campanas: lectura propia marca"   on public.campanas;
drop policy if exists "campanas: creadoras ven activas"  on public.campanas;
drop policy if exists "campanas: admin lectura"          on public.campanas;
drop policy if exists "campanas: admin update"           on public.campanas;

create policy "campanas: lectura propia marca"
  on public.campanas for select
  using (auth.uid() = marca_id);

create policy "campanas: creadoras ven activas"
  on public.campanas for select
  using (
    status = 'activa'
    and public.get_my_rol() = 'creator'
    and exists (
      select 1 from public.creadoras c
      where c.perfil_id = auth.uid() and c.status = 'verificado'
    )
  );

create policy "campanas: admin lectura"
  on public.campanas for select
  using (public.get_my_rol() = 'admin');

create policy "campanas: admin update"
  on public.campanas for update
  using (public.get_my_rol() = 'admin');

-- postulaciones
drop policy if exists "postulaciones: admin lectura" on public.postulaciones;

create policy "postulaciones: admin lectura"
  on public.postulaciones for select
  using (public.get_my_rol() = 'admin');

-- chats
drop policy if exists "chats: admin lectura" on public.chats;

create policy "chats: admin lectura"
  on public.chats for select
  using (public.get_my_rol() = 'admin');

-- ordenes
drop policy if exists "ordenes: admin lectura" on public.ordenes;

create policy "ordenes: admin lectura"
  on public.ordenes for select
  using (public.get_my_rol() = 'admin');

-- correcciones
drop policy if exists "correcciones: admin lectura" on public.correcciones;

create policy "correcciones: admin lectura"
  on public.correcciones for select
  using (public.get_my_rol() = 'admin');

-- feedback_validacion
drop policy if exists "feedback_validacion: admin lee todo"      on public.feedback_validacion;
drop policy if exists "feedback_validacion: solo admin inserta"  on public.feedback_validacion;

create policy "feedback_validacion: admin lee todo"
  on public.feedback_validacion for select
  using (public.get_my_rol() = 'admin');

create policy "feedback_validacion: solo admin inserta"
  on public.feedback_validacion for insert
  with check (
    auth.uid() = admin_id
    and public.get_my_rol() = 'admin'
  );

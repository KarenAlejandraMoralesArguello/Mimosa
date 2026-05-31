-- ============================================================
-- Mimosa Colab Club — Sistema de Notificaciones
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- ============================================================
-- TABLA: notificaciones
-- ============================================================
create table public.notificaciones (
  id         uuid        primary key default gen_random_uuid(),
  perfil_id  uuid        not null references public.perfiles(id) on delete cascade,
  tipo       text        not null,
  titulo     text        not null,
  cuerpo     text        not null,
  link       text,
  leida      boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.notificaciones enable row level security;

create policy "notificaciones: lectura propia"
  on public.notificaciones for select
  using (auth.uid() = perfil_id);

create policy "notificaciones: update propio"
  on public.notificaciones for update
  using (auth.uid() = perfil_id)
  with check (auth.uid() = perfil_id);

create index notificaciones_perfil_idx
  on public.notificaciones (perfil_id, leida, created_at desc);

-- ============================================================
-- FUNCIÓN HELPER: insertar_notificacion
-- Llamada por todos los triggers.
-- ============================================================
create or replace function insertar_notificacion(
  p_perfil_id uuid,
  p_tipo      text,
  p_titulo    text,
  p_cuerpo    text,
  p_link      text default null
) returns void language plpgsql security definer as $$
begin
  insert into public.notificaciones (perfil_id, tipo, titulo, cuerpo, link)
  values (p_perfil_id, p_tipo, p_titulo, p_cuerpo, p_link);
end;
$$;

-- ============================================================
-- TRIGGER 1: Nueva postulación → notificar a la marca
-- ============================================================
create or replace function trigger_notif_postulacion()
returns trigger language plpgsql security definer as $$
declare
  v_marca_id       uuid;
  v_titulo_campana text;
  v_nombre_creadora text;
begin
  select marca_id, titulo into v_marca_id, v_titulo_campana
  from public.campanas where id = NEW.campana_id;

  select nombre into v_nombre_creadora
  from public.perfiles where id = NEW.creadora_id;

  perform insertar_notificacion(
    v_marca_id,
    'nueva_postulacion',
    'Nueva postulante',
    v_nombre_creadora || ' aplicó a tu campaña "' || v_titulo_campana || '"',
    '/marca'
  );
  return NEW;
end;
$$;

drop trigger if exists on_nueva_postulacion on public.postulaciones;
create trigger on_nueva_postulacion
  after insert on public.postulaciones
  for each row execute function trigger_notif_postulacion();

-- ============================================================
-- TRIGGER 2: Nuevo mensaje → notificar al otro participante
-- ============================================================
create or replace function trigger_notif_mensaje()
returns trigger language plpgsql security definer as $$
declare
  v_chat            record;
  v_destinatario_id uuid;
  v_remitente_nombre text;
begin
  select * into v_chat from public.chats where id = NEW.chat_id;

  if NEW.from_perfil_id = v_chat.marca_id then
    v_destinatario_id := v_chat.creadora_id;
  else
    v_destinatario_id := v_chat.marca_id;
  end if;

  select nombre into v_remitente_nombre
  from public.perfiles where id = NEW.from_perfil_id;

  perform insertar_notificacion(
    v_destinatario_id,
    'nuevo_mensaje',
    'Nuevo mensaje de ' || v_remitente_nombre,
    v_remitente_nombre || ' te escribió un mensaje.',
    null
  );
  return NEW;
end;
$$;

drop trigger if exists on_nuevo_mensaje on public.mensajes;
create trigger on_nuevo_mensaje
  after insert on public.mensajes
  for each row execute function trigger_notif_mensaje();

-- ============================================================
-- TRIGGER 3: Cambio de status de creadora → notificar a la creadora
-- ============================================================
create or replace function trigger_notif_validacion_creadora()
returns trigger language plpgsql security definer as $$
begin
  if OLD.status is distinct from NEW.status then
    if NEW.status = 'verificado' then
      perform insertar_notificacion(
        NEW.perfil_id,
        'perfil_aprobado',
        '¡Tu perfil fue aprobado! 🎉',
        'Ya puedes explorar el marketplace y aplicar a campañas.',
        '/creadora'
      );
    elsif NEW.status = 'borrador' and OLD.status in ('en_validacion', 'rechazado') then
      perform insertar_notificacion(
        NEW.perfil_id,
        'perfil_rechazado',
        'Tu perfil necesita ajustes',
        'El equipo dejó feedback. Revísalo y reenvía tu portafolio.',
        '/creadora'
      );
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_validacion_creadora on public.creadoras;
create trigger on_validacion_creadora
  after update on public.creadoras
  for each row execute function trigger_notif_validacion_creadora();

-- ============================================================
-- TRIGGER 4: Cambios en órdenes → notificar a las partes
-- ============================================================
create or replace function trigger_notif_orden()
returns trigger language plpgsql security definer as $$
begin
  -- Nueva orden → notificar a la creadora
  if TG_OP = 'INSERT' then
    perform insertar_notificacion(
      NEW.creadora_id,
      'nueva_orden',
      'Nueva orden recibida',
      'Una marca creó una orden para ti. Revisa los detalles.',
      '/creadora'
    );
    return NEW;
  end if;

  -- Cambio de status
  if OLD.status is distinct from NEW.status then
    case NEW.status
      when 'en_curso' then
        perform insertar_notificacion(
          NEW.marca_id, 'orden_en_curso', 'Orden en curso',
          'La creadora aceptó tu orden y está trabajando en el contenido.',
          '/marca'
        );
      when 'entregado' then
        perform insertar_notificacion(
          NEW.marca_id, 'contenido_entregado', 'Contenido entregado',
          'La creadora entregó el contenido. Revísalo y apruébalo o solicita corrección.',
          '/marca'
        );
      when 'completado' then
        perform insertar_notificacion(
          NEW.creadora_id, 'orden_completada', '¡Orden completada! 💸',
          'La marca aprobó el contenido. Tu pago será procesado pronto.',
          '/creadora'
        );
      when 'cancelado' then
        perform insertar_notificacion(
          NEW.creadora_id, 'orden_cancelada', 'Orden cancelada',
          'Una de tus órdenes fue cancelada.', '/creadora'
        );
        perform insertar_notificacion(
          NEW.marca_id, 'orden_cancelada', 'Orden cancelada',
          'Una de tus órdenes fue cancelada.', '/marca'
        );
      else null;
    end case;
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_orden_cambio on public.ordenes;
create trigger on_orden_cambio
  after insert or update on public.ordenes
  for each row execute function trigger_notif_orden();

-- ============================================================
-- TRIGGER 5: Nueva creadora en validación → notificar a admins
-- ============================================================
create or replace function trigger_notif_admin_creadora()
returns trigger language plpgsql security definer as $$
declare
  v_nombre text;
  v_admin  record;
begin
  if NEW.status = 'en_validacion' then
    select nombre into v_nombre from public.perfiles where id = NEW.perfil_id;

    for v_admin in
      select id from public.perfiles where rol = 'admin'
    loop
      perform insertar_notificacion(
        v_admin.id, 'creadora_pendiente', 'Nueva creadora por validar',
        v_nombre || ' envió su portafolio para revisión.',
        '/admin'
      );
    end loop;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_nueva_creadora_validacion on public.creadoras;
create trigger on_nueva_creadora_validacion
  after insert on public.creadoras
  for each row execute function trigger_notif_admin_creadora();

-- ============================================================
-- TRIGGER 6: Nueva campaña pendiente → notificar a admins
-- ============================================================
create or replace function trigger_notif_admin_campana()
returns trigger language plpgsql security definer as $$
declare
  v_admin        record;
  v_marca_nombre text;
begin
  if NEW.status = 'pendiente' then
    select nombre_comercial into v_marca_nombre
    from public.marcas where perfil_id = NEW.marca_id;

    for v_admin in
      select id from public.perfiles where rol = 'admin'
    loop
      perform insertar_notificacion(
        v_admin.id, 'campana_pendiente', 'Nueva campaña por revisar',
        v_marca_nombre || ' envió "' || NEW.titulo || '" para pre-aprobación.',
        '/admin'
      );
    end loop;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_nueva_campana_pendiente on public.campanas;
create trigger on_nueva_campana_pendiente
  after insert on public.campanas
  for each row execute function trigger_notif_admin_campana();

-- Permite a las marcas leer el perfil (nombre) de creadoras verificadas.
-- Necesario para mostrar el nombre del postulante en el panel de postulantes.

create policy "perfiles: marcas ven creadoras verificadas"
  on public.perfiles for select
  using (
    public.get_my_rol() = 'brand'
    and exists (
      select 1 from public.creadoras c
      where c.perfil_id = id and c.status = 'verificado'
    )
  );

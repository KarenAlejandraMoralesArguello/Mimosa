-- Permite leer la tabla creadoras desde postulaciones (join en BrandDashboard).
-- El join perfiles->creadoras necesita que las marcas puedan leer creadoras verificadas,
-- pero tambien necesitamos que el query de postulaciones pueda hacer el join.
-- Ya existe la politica "creadoras: lectura verificadas" para brands.

-- Politica INSERT para postulaciones (creadoras verificadas pueden postular).
-- Ya existe en schema.sql, pero verificamos que este activa.
-- Si da error "already exists" ignorar, ya esta correcta.

create policy "postulaciones: creadora insert"
  on public.postulaciones for insert
  with check (
    auth.uid() = creadora_id
    and public.get_my_rol() = 'creator'
    and exists (
      select 1 from public.creadoras c
      where c.perfil_id = auth.uid() and c.status = 'verificado'
    )
    and precio_video >= 500
  );

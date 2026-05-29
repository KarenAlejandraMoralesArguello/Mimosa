-- Politica INSERT para campanas (faltaba en el schema original).
-- Solo marcas pueden crear campanas donde ellas son la marca.
-- Ya existia en schema.sql pero era necesario confirmarla.

create policy "campanas: marca insert"
  on public.campanas for insert
  with check (auth.uid() = marca_id);

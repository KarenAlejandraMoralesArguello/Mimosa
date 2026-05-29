-- Política INSERT para órdenes (faltaba en el schema original).
-- Solo marcas pueden crear órdenes donde ellas son la marca.

create policy "ordenes: marca insert"
  on public.ordenes for insert
  with check (auth.uid() = marca_id);

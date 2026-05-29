-- Permite campana_id y creadora_id nulos en órdenes mientras el flujo
-- de campañas y postulaciones no está en Supabase (Fase 2).
-- REVERTIR antes de producción con:
--   ALTER TABLE public.ordenes ALTER COLUMN campana_id SET NOT NULL;
--   ALTER TABLE public.ordenes ALTER COLUMN creadora_id SET NOT NULL;

ALTER TABLE public.ordenes ALTER COLUMN campana_id  DROP NOT NULL;
ALTER TABLE public.ordenes ALTER COLUMN creadora_id DROP NOT NULL;

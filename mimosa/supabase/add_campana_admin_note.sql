-- Agrega campo de nota de admin a campanas (Fase 2B).
-- Permite al admin dejar razón al rechazar una campaña.
-- Ejecutar en Supabase Dashboard → SQL Editor.

ALTER TABLE public.campanas ADD COLUMN IF NOT EXISTS admin_note text;

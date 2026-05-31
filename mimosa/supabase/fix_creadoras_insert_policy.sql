-- Permite que una creadora recién registrada inserte su propia fila.
-- Sin esta política, el INSERT desde Register.jsx falla silenciosamente (RLS).
-- Ejecutar en Supabase Dashboard → SQL Editor.

CREATE POLICY "creadoras: insert propio al registrarse"
  ON public.creadoras FOR INSERT
  WITH CHECK (auth.uid() = perfil_id);

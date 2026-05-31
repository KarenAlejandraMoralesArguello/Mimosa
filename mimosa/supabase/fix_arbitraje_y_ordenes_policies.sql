-- ============================================================
-- FIX: Políticas de actualización de órdenes y acceso al chat para Admin y Marcas
-- Ejecutar en el SQL Editor de Supabase para habilitar el arbitraje.
-- ============================================================

-- 1. Permitir a los Admins leer todos los mensajes de chat para inspección de arbitraje
DROP POLICY IF EXISTS "mensajes: admin lectura" ON public.mensajes;
CREATE POLICY "mensajes: admin lectura"
  ON public.mensajes FOR SELECT
  USING (public.get_my_rol() = 'admin');

-- 2. Permitir a los Admins actualizar cualquier orden para resolver disputas (arbitraje)
DROP POLICY IF EXISTS "ordenes: admin update" ON public.ordenes;
CREATE POLICY "ordenes: admin update"
  ON public.ordenes FOR UPDATE
  USING (public.get_my_rol() = 'admin')
  WITH CHECK (public.get_my_rol() = 'admin');

-- 3. Permitir a las Marcas actualizar sus propias órdenes (para aprobar/solicitar correcciones)
DROP POLICY IF EXISTS "ordenes: marca update" ON public.ordenes;
CREATE POLICY "ordenes: marca update"
  ON public.ordenes FOR UPDATE
  USING (auth.uid() = marca_id)
  WITH CHECK (auth.uid() = marca_id);

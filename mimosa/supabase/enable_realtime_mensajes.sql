-- Habilita Realtime en la tabla mensajes para que el chat funcione en tiempo real.
-- Ya ejecutado en produccion via MCP.
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;

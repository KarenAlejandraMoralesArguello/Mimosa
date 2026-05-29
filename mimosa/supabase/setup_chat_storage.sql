-- Crear el bucket para adjuntos de chat.
-- Ejecutar en Supabase Dashboard → Storage, o via SQL Editor:

-- 1. Crear bucket (público para que los URLs sean accesibles directamente)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  true,
  5242880,  -- 5 MB
  array['image/jpeg','image/png','image/gif','image/webp','application/pdf',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain']
)
on conflict (id) do nothing;

-- 2. Política: participantes del chat pueden subir archivos
create policy "chat-attachments: upload participante"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.chats c
      where c.id = (storage.foldername(name))[1]::uuid
        and (c.marca_id = auth.uid() or c.creadora_id = auth.uid())
    )
  );

-- 3. Política: cualquiera puede leer (bucket público)
create policy "chat-attachments: lectura publica"
  on storage.objects for select
  using (bucket_id = 'chat-attachments');

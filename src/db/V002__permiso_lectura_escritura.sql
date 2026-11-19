-- Permisos de lectura
grant usage on schema public to anon, authenticated;
grant select on table public.lego_sets to anon, authenticated;

-- Permisos de escritura
grant all on table public.lego_sets to service_role;
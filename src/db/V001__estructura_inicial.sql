-- 1. Tabla principal de sets LEGO
create table public.lego_sets (
  id uuid primary key default gen_random_uuid(),
  set_number text not null,
  name text not null,
  image_url text,
  manuals jsonb not null default '[]'::jsonb,
  last_manual_index integer not null default 0,
  last_page integer not null default 1,
  is_built boolean not null default false,
  built_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint manuals_is_array check (jsonb_typeof(manuals) = 'array'),
  constraint last_manual_index_non_negative check (last_manual_index >= 0),
  constraint last_page_positive check (last_page >= 1)
);

-- 2. Índice para filtrar rápido entre pendientes (/), archivados (/montados) y orden de creación
create index idx_lego_sets_status
  on public.lego_sets (is_built, created_at desc);

-- 3. Trigger para actualizar updated_at automáticamente en cada modificación
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_lego_sets_updated_at
  before update on public.lego_sets
  for each row execute function public.set_updated_at();

-- 4. Seguridad RLS: lectura pública para el cliente; escrituras bloqueadas al exterior
alter table public.lego_sets enable row level security;

create policy "Lectura publica de sets"
  on public.lego_sets for select
  using (true);
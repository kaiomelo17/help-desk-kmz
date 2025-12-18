-- NOTE: For development, RLS is disabled. Enable and add proper policies for production.

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  name text not null,
  setor text,
  cargo text,
  password_hash text not null,
  tier text not null check (tier in ('padrao','vip','admin')),
  is_admin boolean generated always as (tier = 'admin') stored,
  created_at timestamptz default now()
);

create table if not exists public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text unique not null,
  responsavel text,
  ramal text,
  localizacao text,
  created_at timestamptz default now()
);

create table if not exists public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null,
  patrimonio text unique not null,
  status text not null check (status in ('Disponível','Em Uso','Manutenção','Inativo')),
  usuario text,
  setor text,
  marca text,
  modelo text,
  ram text,
  armazenamento text,
  processador text,
  polegadas text,
  ghz text,
  created_at timestamptz default now()
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null,
  descricao text,
  estoque integer not null default 0,
  created_at timestamptz default now()
);

alter table public.produtos add constraint produtos_estoque_nonneg check (estoque >= 0);

create table if not exists public.produto_saidas (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  quantidade integer not null,
  destinatario text,
  data date not null default (now()::date),
  created_at timestamptz default now()
);

alter table public.produto_saidas add constraint produto_saidas_quantidade_pos check (quantidade > 0);

create or replace function public.produto_saidas_update_estoque() returns trigger language plpgsql as $$
begin
  update public.produtos set estoque = greatest(0, estoque - NEW.quantidade) where id = NEW.produto_id;
  return NEW;
end;
$$;

create trigger trg_produto_saidas_after_insert
after insert on public.produto_saidas
for each row execute function public.produto_saidas_update_estoque();

create table if not exists public.chamados (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null,
  prioridade text not null check (prioridade in ('baixa','media','alta')),
  status text not null check (status in ('Aberto','Em Andamento','Concluído')),
  usuario text not null,
  solicitante text not null,
  setor text not null,
  tipo_servico text not null,
  is_vip boolean not null default false,
  data date not null default (now()::date),
  started_at timestamptz,
  completed_at timestamptz,
  solution_duration_min integer,
  tempo_solucao_minutos integer,
  tempo_solucao_texto text,
  created_at timestamptz default now()
);

ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS solution_duration_min integer;
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS tempo_solucao_minutos integer;
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS tempo_solucao_texto text;

create or replace function public.chamados_set_priority() returns trigger language plpgsql as $$
begin
  if NEW.is_vip then NEW.prioridade := 'alta'; end if;
  return NEW;
end;
$$;

create trigger trg_chamados_before_insert
before insert on public.chamados
for each row execute function public.chamados_set_priority();

-- Disable RLS for dev
alter table public.app_users set (rowsecurity = off);
alter table public.setores set (rowsecurity = off);
alter table public.equipamentos set (rowsecurity = off);
alter table public.produtos set (rowsecurity = off);
alter table public.produto_saidas set (rowsecurity = off);
alter table public.chamados set (rowsecurity = off);

create index if not exists idx_app_users_tier on public.app_users(tier);
create index if not exists idx_equipamentos_status on public.equipamentos(status);
create index if not exists idx_produtos_categoria on public.produtos(categoria);
create index if not exists idx_produto_saidas_produto_data on public.produto_saidas(produto_id, data);
create index if not exists idx_chamados_status on public.chamados(status);
create index if not exists idx_chamados_prioridade on public.chamados(prioridade);
create index if not exists idx_chamados_data on public.chamados(data);
create index if not exists idx_chamados_started_at on public.chamados(started_at);
create index if not exists idx_chamados_completed_at on public.chamados(completed_at);
create index if not exists idx_chamados_solution_duration on public.chamados(solution_duration_min);
create index if not exists idx_chamados_tempo_solucao_minutos on public.chamados(tempo_solucao_minutos);

-- Posto.ai: lidhja e llogarive sociale dhe publikimi me një klik
-- Ekzekutojeni një herë në Supabase SQL Editor.

-- 1. Llogaritë e lidhura (LinkedIn, Facebook Page, Instagram Business)
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('linkedin', 'facebook', 'instagram')),
  external_id text not null,          -- ID e profilit/faqes/llogarisë në platformë
  display_name text,
  avatar_url text,
  access_token_enc text not null,     -- token i enkriptuar me AES-256-GCM (SOCIAL_TOKEN_KEY)
  token_expires_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, external_id)
);

-- RLS aktiv pa asnjë policy: vetëm serveri (service role) i lexon tokenat.
alter table public.social_accounts enable row level security;

-- 2. Historiku i publikimeve
create table if not exists public.post_publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id text not null,              -- posts.id (si tekst që të funksionojë për uuid ose bigint)
  post_index int not null default 0,  -- cili postim brenda planit
  social_account_id uuid references public.social_accounts(id) on delete set null,
  platform text not null,
  status text not null check (status in ('success', 'failed')),
  external_post_id text,
  external_url text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists post_publications_post_idx on public.post_publications (user_id, post_id);

alter table public.post_publications enable row level security;

drop policy if exists "Users read own publications" on public.post_publications;
create policy "Users read own publications" on public.post_publications
  for select using (auth.uid() = user_id);

-- 3. Bucket publik për imazhet (platformat kërkojnë një link publik)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- NJTI 后端版 Supabase 建表 SQL
-- 如果你已经按前面的步骤创建过 njti_results 表，可以不用重复执行。

create extension if not exists pgcrypto;

create table if not exists public.njti_results (
  id uuid primary key default gen_random_uuid(),
  share_id text unique not null default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz not null default now(),

  language text not null default 'zh',
  personality_id text not null,
  personality_name text not null,
  dimension_code text,

  answers jsonb not null,
  scores jsonb not null,
  percentages jsonb not null,

  user_agent text,
  referrer text
);

alter table public.njti_results enable row level security;

create index if not exists njti_results_created_at_idx
on public.njti_results (created_at desc);

create index if not exists njti_results_personality_id_idx
on public.njti_results (personality_id);

create index if not exists njti_results_share_id_idx
on public.njti_results (share_id);

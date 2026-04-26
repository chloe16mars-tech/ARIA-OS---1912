-- ──────────────────────────────────────────────────────────────────────────
-- ARIA-OS — Initial Postgres schema
--
-- Tables, Row-Level Security policies and stored procedures consumed by
-- the API (`src/server/api.router.ts`) and by the frontend services.
--
-- Apply with the Supabase CLI:
--   supabase db push
-- or paste in the SQL editor of the Supabase dashboard.
-- ──────────────────────────────────────────────────────────────────────────

-- ── Profiles ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  photo_url text,
  generation_count integer not null default 0,
  anonymous_generation_count integer not null default 0,
  last_generation_date timestamptz,
  scheduled_deletion_date timestamptz,
  preferences jsonb not null default '{}'::jsonb,
  read_notifications text[] not null default '{}',
  deleted_notifications text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self_select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id);

-- New auth users get a profile row automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, photo_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Scripts ───────────────────────────────────────────────────────────────
create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text,
  source_text text,
  source_type text not null,
  intention text not null,
  tone text not null,
  stance text,
  duration text not null,
  content text not null,
  title text,
  pinned boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists scripts_user_idx on public.scripts (user_id, created_at desc);

alter table public.scripts enable row level security;

create policy "scripts_self_select"
  on public.scripts for select
  using (auth.uid() = user_id);

create policy "scripts_self_insert"
  on public.scripts for insert
  with check (auth.uid() = user_id);

create policy "scripts_self_update"
  on public.scripts for update
  using (auth.uid() = user_id);

create policy "scripts_self_delete"
  on public.scripts for delete
  using (auth.uid() = user_id);

-- ── Notifications ─────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null check (type in ('update', 'info', 'alert')),
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_authenticated_select"
  on public.notifications for select
  using (auth.role() = 'authenticated');

-- ── Global stats (single row, id = 1) ─────────────────────────────────────
create table if not exists public.global_stats (
  id integer primary key default 1,
  total_generations bigint not null default 0,
  check (id = 1)
);

insert into public.global_stats (id, total_generations)
  values (1, 0)
  on conflict (id) do nothing;

alter table public.global_stats enable row level security;

create policy "global_stats_authenticated_select"
  on public.global_stats for select
  using (auth.role() = 'authenticated');

-- ── RPCs consumed by the API ──────────────────────────────────────────────

-- Anonymous accounts may generate at most 2 scripts per rolling 24 h.
create or replace function public.check_anonymous_quota(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_last  timestamptz;
begin
  select anonymous_generation_count, last_generation_date
    into v_count, v_last
    from public.profiles
    where id = p_user_id;

  if v_count is null then
    return true; -- profile not yet created (will be by trigger)
  end if;

  -- Reset the rolling window if last generation is older than 24 h.
  if v_last is null or v_last < now() - interval '24 hours' then
    return true;
  end if;

  return v_count < 2;
end;
$$;

create or replace function public.increment_global_generations()
returns void
language sql
security definer
set search_path = public
as $$
  update public.global_stats
     set total_generations = total_generations + 1
   where id = 1;
$$;

create or replace function public.increment_user_generation_count(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set generation_count = coalesce(generation_count, 0) + 1,
         last_generation_date = now()
   where id = p_user_id;
end;
$$;

create or replace function public.increment_anonymous_generation_count(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last timestamptz;
begin
  select last_generation_date into v_last
    from public.profiles
    where id = p_user_id;

  -- Reset the counter if the previous generation is outside the window.
  if v_last is null or v_last < now() - interval '24 hours' then
    update public.profiles
       set anonymous_generation_count = 1,
           last_generation_date = now()
     where id = p_user_id;
  else
    update public.profiles
       set anonymous_generation_count = coalesce(anonymous_generation_count, 0) + 1,
           last_generation_date = now()
     where id = p_user_id;
  end if;
end;
$$;

-- Restrict RPC execution to authenticated callers.
revoke all on function public.check_anonymous_quota(uuid) from public;
revoke all on function public.increment_global_generations() from public;
revoke all on function public.increment_user_generation_count(uuid) from public;
revoke all on function public.increment_anonymous_generation_count(uuid) from public;

grant execute on function public.check_anonymous_quota(uuid) to authenticated, service_role;
grant execute on function public.increment_global_generations() to authenticated, service_role;
grant execute on function public.increment_user_generation_count(uuid) to authenticated, service_role;
grant execute on function public.increment_anonymous_generation_count(uuid) to authenticated, service_role;

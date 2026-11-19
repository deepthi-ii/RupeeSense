-- RupeeSense database schema
-- Run the entire file in Supabase Dashboard -> SQL Editor.
-- Uses Supabase Auth. Never expose the service_role key in the browser.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  upi_id text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.personal_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Other',
  txn_date date not null default current_date,
  payment_method text default 'Other',
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  saved_amount numeric(12,2) not null default 0 check (saved_amount >= 0),
  target_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  room_type text default 'Shared living',
  created_by uuid not null references auth.users(id),
  invite_code text not null unique,
  settlement_deadline date,
  billing_cycle text default 'Monthly',
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  unique(room_id,user_id)
);

create table if not exists public.group_expenses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  paid_by uuid not null references auth.users(id),
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Other',
  expense_date date not null default current_date,
  split_type text not null default 'equal' check (split_type in ('equal','custom')),
  created_at timestamptz not null default now()
);

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.group_expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  amount numeric(12,2) not null check (amount >= 0),
  unique(expense_id,user_id)
);

create table if not exists public.settlement_payments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  from_user_id uuid not null references auth.users(id),
  to_user_id uuid not null references auth.users(id),
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','confirmed','failed','disputed')),
  reference text,
  created_by uuid not null references auth.users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

create table if not exists public.billing_cycles (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  settlement_deadline date,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_room_member(check_room uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where room_id = check_room and user_id = auth.uid()
  );
$$;

create or replace function public.join_room_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare found_room uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select id into found_room from public.rooms
  where upper(invite_code) = upper(trim(p_code));
  if found_room is null then raise exception 'Invitation code not found'; end if;
  insert into public.room_members(room_id,user_id,role)
  values(found_room,auth.uid(),'member')
  on conflict(room_id,user_id) do nothing;
  return found_room;
end;
$$;

alter table public.profiles enable row level security;
alter table public.personal_transactions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.group_expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlement_payments enable row level security;
alter table public.billing_cycles enable row level security;
alter table public.notifications enable row level security;

create policy "profiles read self or room members" on public.profiles for select to authenticated
using (id = auth.uid() or exists (
  select 1 from public.room_members a
  join public.room_members b on a.room_id=b.room_id
  where a.user_id=auth.uid() and b.user_id=profiles.id
));
create policy "profiles insert self" on public.profiles for insert to authenticated with check (id=auth.uid());
create policy "profiles update self" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

create policy "personal transactions own all" on public.personal_transactions for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "savings goals own all" on public.savings_goals for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());

create policy "rooms members read" on public.rooms for select to authenticated
using (public.is_room_member(id) or created_by=auth.uid());
create policy "rooms creator insert" on public.rooms for insert to authenticated
with check (created_by=auth.uid());
create policy "rooms creator update" on public.rooms for update to authenticated
using (created_by=auth.uid()) with check (created_by=auth.uid());
create policy "rooms creator delete" on public.rooms for delete to authenticated
using (created_by=auth.uid());

create policy "room members read in same room" on public.room_members for select to authenticated
using (public.is_room_member(room_id) or user_id=auth.uid());
create policy "room owner adds own membership" on public.room_members for insert to authenticated
with check (
  user_id=auth.uid()
  and role='owner'
  and exists(select 1 from public.rooms r where r.id=room_id and r.created_by=auth.uid())
);
create policy "room owner remove members" on public.room_members for delete to authenticated
using (exists(select 1 from public.rooms r where r.id=room_id and r.created_by=auth.uid()));

create policy "group expenses members read" on public.group_expenses for select to authenticated
using (public.is_room_member(room_id));
create policy "group expenses members insert" on public.group_expenses for insert to authenticated
with check (public.is_room_member(room_id) and created_by=auth.uid() and paid_by=auth.uid());
create policy "group expenses creator update" on public.group_expenses for update to authenticated
using (created_by=auth.uid()) with check (created_by=auth.uid());
create policy "group expenses creator delete" on public.group_expenses for delete to authenticated
using (created_by=auth.uid());

create policy "splits members read" on public.expense_splits for select to authenticated
using (exists(select 1 from public.group_expenses e where e.id=expense_id and public.is_room_member(e.room_id)));
create policy "splits members insert" on public.expense_splits for insert to authenticated
with check (exists(select 1 from public.group_expenses e where e.id=expense_id and public.is_room_member(e.room_id)));

create policy "payments room members read" on public.settlement_payments for select to authenticated
using (public.is_room_member(room_id));
create policy "payments payer insert" on public.settlement_payments for insert to authenticated
with check (created_by=auth.uid() and from_user_id=auth.uid() and public.is_room_member(room_id));
create policy "payments recipient confirm" on public.settlement_payments for update to authenticated
using (to_user_id=auth.uid() and public.is_room_member(room_id))
with check (to_user_id=auth.uid() and public.is_room_member(room_id));

create policy "cycles room members read" on public.billing_cycles for select to authenticated
using (public.is_room_member(room_id));
create policy "cycles owner manage" on public.billing_cycles for all to authenticated
using (exists(select 1 from public.rooms r where r.id=room_id and r.created_by=auth.uid()))
with check (exists(select 1 from public.rooms r where r.id=room_id and r.created_by=auth.uid()));

create policy "notifications own all" on public.notifications for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());

grant execute on function public.join_room_by_code(text) to authenticated;
grant execute on function public.is_room_member(uuid) to authenticated;

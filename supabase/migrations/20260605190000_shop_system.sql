alter table public.profiles
add column if not exists essence_balance integer not null default 0 check (essence_balance >= 0);

create table if not exists public.shop_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  cost_paid integer not null check (cost_paid >= 0),
  purchased_at timestamptz not null default now()
);

alter table public.shop_purchases enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'shop_purchases'
      and policyname = 'Users can read own shop purchases'
  ) then
    create policy "Users can read own shop purchases"
    on public.shop_purchases for select
    using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'shop_purchases'
      and policyname = 'Users can insert own shop purchases'
  ) then
    create policy "Users can insert own shop purchases"
    on public.shop_purchases for insert
    with check (auth.uid() = user_id);
  end if;
end $$;

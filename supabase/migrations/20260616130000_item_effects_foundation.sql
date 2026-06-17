alter table public.user_item_activations
  add column if not exists consumed_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.user_challenges
  add column if not exists xp_awarded integer not null default 0,
  add column if not exists essence_awarded integer not null default 0,
  add column if not exists applied_item_activation_ids uuid[] not null default '{}'::uuid[];

update public.user_challenges
set xp_awarded = challenges.xp_reward,
    essence_awarded = greatest(5, round(challenges.xp_reward / 5.0))
from public.challenges
where public.user_challenges.challenge_id = challenges.id
  and public.user_challenges.status = 'completed'
  and public.user_challenges.xp_awarded = 0
  and public.user_challenges.essence_awarded = 0;

insert into public.user_item_activations (user_id, item_id, activated_at)
select shop_purchases.user_id, shop_purchases.item_id, shop_purchases.purchased_at
from public.shop_purchases
where shop_purchases.item_id in (
  'hunter-legacy',
  'paragon-aura',
  'paragon-nameplate',
  'crystal-banner',
  'rank-showcase-pedestal',
  'iterated-aura',
  'cosmic-hunter-frame',
  'living-nameplate',
  'hall-of-legends-monument',
  'founders-relic'
)
and not exists (
  select 1
  from public.user_item_activations
  where user_item_activations.user_id = shop_purchases.user_id
    and user_item_activations.item_id = shop_purchases.item_id
);

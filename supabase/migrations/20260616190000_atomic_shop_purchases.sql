drop function if exists public.purchase_shop_item(text, integer);

create or replace function public.purchase_shop_item(target_item_id text, configured_cost integer default null)
returns public.shop_purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  purchase_row public.shop_purchases%rowtype;
  current_essence integer := 0;
  current_total_xp integer := 0;
  item_cost integer := null;
  required_total_xp integer := 0;
  is_repeatable boolean := true;
  auto_activate boolean := false;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to purchase shop items.';
  end if;

  case target_item_id
    when 'bonus-challenge-scroll' then item_cost := 250; required_total_xp := 0; is_repeatable := true;
    when 'double-xp-sigil' then item_cost := 500; required_total_xp := 0; is_repeatable := true;
    when 'focus-lens' then item_cost := 300; required_total_xp := 0; is_repeatable := true;
    when 'iron-will-token' then item_cost := 300; required_total_xp := 0; is_repeatable := true;
    when 'scholars-seal' then item_cost := 300; required_total_xp := 0; is_repeatable := true;
    when 'streak-shield' then item_cost := 1500; required_total_xp := 0; is_repeatable := true;

    when 'elite-contract' then item_cost := 500; required_total_xp := 250; is_repeatable := true;
    when 'challenge-reroll-token' then item_cost := 350; required_total_xp := 250; is_repeatable := true;
    when 'lucky-crystal' then item_cost := 750; required_total_xp := 250; is_repeatable := true;
    when 'momentum-crystal' then item_cost := 2000; required_total_xp := 250; is_repeatable := true;

    when 'goblin-kings-gate-key' then item_cost := 1000; required_total_xp := 750; is_repeatable := true;
    when 'deep-work-gate-key' then item_cost := 1000; required_total_xp := 750; is_repeatable := true;
    when 'iron-trial-key' then item_cost := 1000; required_total_xp := 750; is_repeatable := true;
    when 'challenge-chain' then item_cost := 1200; required_total_xp := 750; is_repeatable := true;

    when 'trial-of-ascension' then item_cost := 3000; required_total_xp := 1500; is_repeatable := true;
    when 'hunters-oath' then item_cost := 1500; required_total_xp := 1500; is_repeatable := true;
    when 'essence-gamble' then
      item_cost := configured_cost;
      required_total_xp := 1500;
      is_repeatable := true;

      if item_cost is null or item_cost not in (250, 500, 1000, 2500) then
        raise exception 'Essence Gamble requires a valid stake.';
      end if;

    when 'legendary-trial' then item_cost := 5000; required_total_xp := 3000; is_repeatable := true;
    when 'legendary-contract' then item_cost := 2500; required_total_xp := 3000; is_repeatable := true;

    when 'mythic-trial' then item_cost := 10000; required_total_xp := 5000; is_repeatable := true;
    when 'hunter-legacy' then item_cost := 5000; required_total_xp := 5000; is_repeatable := false; auto_activate := true;
    when 'master-boss-key' then item_cost := 3000; required_total_xp := 5000; is_repeatable := true;

    when 'paragon-aura' then item_cost := 5000; required_total_xp := 8000; is_repeatable := false; auto_activate := true;
    when 'paragon-nameplate' then item_cost := 4000; required_total_xp := 8000; is_repeatable := false; auto_activate := true;
    when 'crystal-banner' then item_cost := 6000; required_total_xp := 8000; is_repeatable := false; auto_activate := true;
    when 'rank-showcase-pedestal' then item_cost := 8000; required_total_xp := 8000; is_repeatable := false; auto_activate := true;

    when 'iterated-aura' then item_cost := 15000; required_total_xp := 12000; is_repeatable := false; auto_activate := true;
    when 'cosmic-hunter-frame' then item_cost := 12000; required_total_xp := 12000; is_repeatable := false; auto_activate := true;
    when 'living-nameplate' then item_cost := 15000; required_total_xp := 12000; is_repeatable := false; auto_activate := true;
    when 'hall-of-legends-monument' then item_cost := 25000; required_total_xp := 12000; is_repeatable := false; auto_activate := true;
    when 'founders-relic' then item_cost := 20000; required_total_xp := 12000; is_repeatable := false; auto_activate := true;
    else
      raise exception 'Shop item could not be found.';
  end case;

  select essence_balance, total_xp
  into current_essence, current_total_xp
  from public.profiles
  where id = current_user_id;

  if current_total_xp < required_total_xp then
    raise exception 'Your current rank does not meet this item''s requirement.';
  end if;

  if current_essence < item_cost then
    raise exception 'You do not have enough Essence to buy this item.';
  end if;

  if not is_repeatable and exists (
    select 1
    from public.shop_purchases
    where user_id = current_user_id
      and item_id = target_item_id
  ) then
    raise exception 'This permanent item is already owned.';
  end if;

  update public.profiles
  set essence_balance = essence_balance - item_cost
  where id = current_user_id;

  insert into public.shop_purchases (user_id, item_id, cost_paid)
  values (current_user_id, target_item_id, item_cost)
  returning * into purchase_row;

  if auto_activate then
    insert into public.user_item_activations (user_id, item_id)
    values (current_user_id, target_item_id);
  end if;

  return purchase_row;
end;
$$;

revoke all on function public.purchase_shop_item(text, integer) from public;
grant execute on function public.purchase_shop_item(text, integer) to authenticated;

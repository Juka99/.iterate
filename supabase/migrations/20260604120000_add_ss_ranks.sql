update public.ranks
set max_xp = 7999
where name = 'S';

insert into public.ranks (name, min_xp, max_xp, "order")
values
  ('SS', 8000, 11999, 7),
  ('SSS', 12000, null, 8)
on conflict (name) do update
set
  min_xp = excluded.min_xp,
  max_xp = excluded.max_xp,
  "order" = excluded."order";

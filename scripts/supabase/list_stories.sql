-- Paste into the Supabase SQL editor to list story ids and display titles.

select
  id,
  coalesce(blueprint->>'title', name) as title,
  name,
  status,
  created_at,
  updated_at
from public.stories
order by updated_at desc;

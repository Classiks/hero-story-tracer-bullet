-- Phase 1: durable ownership foundation.
-- Run this in the Supabase SQL editor after anonymous auth is enabled.

create extension if not exists pgcrypto;

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal text not null,
  challenge text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  blueprint jsonb,
  story_image_path text,
  story_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  status text not null default 'proposed'
    check (status in ('proposed', 'accepted', 'completed', 'unresolved', 'rejected')),
  recommended_task jsonb,
  quest jsonb,
  accepted_at timestamptz,
  outcome_status text check (outcome_status in ('completed', 'unresolved', 'rejected')),
  feedback jsonb not null default '{}'::jsonb,
  result_text jsonb,
  result_image_path text,
  result_image_url text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, sequence_number)
);

create table if not exists public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete cascade,
  kind text not null check (kind in ('story_image', 'quest_result_image')),
  bucket text not null default 'generated-assets',
  path text not null,
  display_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stories_user_id_idx on public.stories(user_id);
create index if not exists stories_user_status_idx on public.stories(user_id, status);
create index if not exists quests_story_id_idx on public.quests(story_id);
create index if not exists generated_assets_user_id_idx on public.generated_assets(user_id);
create index if not exists generated_assets_story_id_idx on public.generated_assets(story_id);
create index if not exists generated_assets_quest_id_idx on public.generated_assets(quest_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stories_set_updated_at on public.stories;
create trigger stories_set_updated_at
before update on public.stories
for each row execute function public.set_updated_at();

drop trigger if exists quests_set_updated_at on public.quests;
create trigger quests_set_updated_at
before update on public.quests
for each row execute function public.set_updated_at();

drop trigger if exists generated_assets_set_updated_at on public.generated_assets;
create trigger generated_assets_set_updated_at
before update on public.generated_assets
for each row execute function public.set_updated_at();

alter table public.stories enable row level security;
alter table public.quests enable row level security;
alter table public.generated_assets enable row level security;

drop policy if exists "Users can select own stories" on public.stories;
create policy "Users can select own stories"
on public.stories for select
using (user_id = auth.uid());

drop policy if exists "Users can insert own stories" on public.stories;
create policy "Users can insert own stories"
on public.stories for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own stories" on public.stories;
create policy "Users can update own stories"
on public.stories for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own stories" on public.stories;
create policy "Users can delete own stories"
on public.stories for delete
using (user_id = auth.uid());

drop policy if exists "Users can select quests for own stories" on public.quests;
create policy "Users can select quests for own stories"
on public.quests for select
using (
  exists (
    select 1
    from public.stories
    where stories.id = quests.story_id
      and stories.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert quests for own stories" on public.quests;
create policy "Users can insert quests for own stories"
on public.quests for insert
with check (
  exists (
    select 1
    from public.stories
    where stories.id = quests.story_id
      and stories.user_id = auth.uid()
  )
);

drop policy if exists "Users can update quests for own stories" on public.quests;
create policy "Users can update quests for own stories"
on public.quests for update
using (
  exists (
    select 1
    from public.stories
    where stories.id = quests.story_id
      and stories.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.stories
    where stories.id = quests.story_id
      and stories.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete quests for own stories" on public.quests;
create policy "Users can delete quests for own stories"
on public.quests for delete
using (
  exists (
    select 1
    from public.stories
    where stories.id = quests.story_id
      and stories.user_id = auth.uid()
  )
);

drop policy if exists "Users can select own generated assets" on public.generated_assets;
create policy "Users can select own generated assets"
on public.generated_assets for select
using (user_id = auth.uid());

drop policy if exists "Users can insert own generated assets" on public.generated_assets;
create policy "Users can insert own generated assets"
on public.generated_assets for insert
with check (
  user_id = auth.uid()
  and (
    story_id is null
    or exists (
      select 1
      from public.stories
      where stories.id = generated_assets.story_id
        and stories.user_id = auth.uid()
    )
  )
  and (
    quest_id is null
    or exists (
      select 1
      from public.quests
      join public.stories on stories.id = quests.story_id
      where quests.id = generated_assets.quest_id
        and stories.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own generated assets" on public.generated_assets;
create policy "Users can update own generated assets"
on public.generated_assets for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    story_id is null
    or exists (
      select 1
      from public.stories
      where stories.id = generated_assets.story_id
        and stories.user_id = auth.uid()
    )
  )
  and (
    quest_id is null
    or exists (
      select 1
      from public.quests
      join public.stories on stories.id = quests.story_id
      where quests.id = generated_assets.quest_id
        and stories.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can delete own generated assets" on public.generated_assets;
create policy "Users can delete own generated assets"
on public.generated_assets for delete
using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('generated-assets', 'generated-assets', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users can select own generated asset objects" on storage.objects;
create policy "Users can select own generated asset objects"
on storage.objects for select
using (
  bucket_id = 'generated-assets'
  and owner = auth.uid()
);

drop policy if exists "Users can insert own generated asset objects" on storage.objects;
create policy "Users can insert own generated asset objects"
on storage.objects for insert
with check (
  bucket_id = 'generated-assets'
  and owner = auth.uid()
);

drop policy if exists "Users can update own generated asset objects" on storage.objects;
create policy "Users can update own generated asset objects"
on storage.objects for update
using (
  bucket_id = 'generated-assets'
  and owner = auth.uid()
)
with check (
  bucket_id = 'generated-assets'
  and owner = auth.uid()
);

drop policy if exists "Users can delete own generated asset objects" on storage.objects;
create policy "Users can delete own generated asset objects"
on storage.objects for delete
using (
  bucket_id = 'generated-assets'
  and owner = auth.uid()
);

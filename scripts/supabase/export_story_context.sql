-- Paste into the Supabase SQL editor to export one story and its quest context.
-- Replace <story-id-here> with the story id you want to export.

with target_story as (
  select '<story-id-here>'::uuid as story_id
),
story_row as (
  select stories.*
  from public.stories
  join target_story on target_story.story_id = stories.id
),
quest_rows as (
  select quests.*
  from public.quests
  join target_story on target_story.story_id = quests.story_id
),
asset_rows as (
  select generated_assets.*
  from public.generated_assets
  where generated_assets.story_id in (select story_id from target_story)
     or generated_assets.quest_id in (select id from quest_rows)
),
story_payload as (
  select to_jsonb(story_row) as story
  from story_row
),
quest_payload as (
  select coalesce(
    jsonb_agg(to_jsonb(quest_rows) order by quest_rows.sequence_number asc),
    '[]'::jsonb
  ) as quests
  from quest_rows
),
asset_payload as (
  select coalesce(
    jsonb_agg(to_jsonb(asset_rows) order by asset_rows.created_at asc),
    '[]'::jsonb
  ) as generated_assets
  from asset_rows
)
select jsonb_pretty(
  jsonb_build_object(
    'exported_at', now(),
    'requested_story_id', (select story_id from target_story),
    'story_found', exists(select 1 from story_row),
    'title', (
      select coalesce(story_row.blueprint->>'title', story_row.name)
      from story_row
    ),
    'counts', jsonb_build_object(
      'quests', (select count(*) from quest_rows),
      'generated_assets', (select count(*) from asset_rows)
    ),
    'story', coalesce((select story from story_payload), 'null'::jsonb),
    'quests', (select quests from quest_payload),
    'generated_assets', (select generated_assets from asset_payload)
  )
) as story_export;

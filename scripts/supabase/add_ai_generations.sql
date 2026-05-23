-- Adds durable AI generation idempotency locks for existing Phase 1 databases.

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  kind text not null check (
    kind in (
      'story_blueprint',
      'quest_proposal',
      'quest_result_text',
      'story_image',
      'quest_result_image'
    )
  ),
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  result_story_id uuid references public.stories(id) on delete set null,
  result_quest_id uuid references public.quests(id) on delete set null,
  error text,
  locked_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create index if not exists ai_generations_user_key_idx on public.ai_generations(user_id, key);
create index if not exists ai_generations_status_locked_until_idx on public.ai_generations(status, locked_until);

drop trigger if exists ai_generations_set_updated_at on public.ai_generations;
create trigger ai_generations_set_updated_at
before update on public.ai_generations
for each row execute function public.set_updated_at();

alter table public.ai_generations enable row level security;

drop policy if exists "Users can select own ai generations" on public.ai_generations;
create policy "Users can select own ai generations"
on public.ai_generations for select
using (user_id = auth.uid());

drop policy if exists "Users can insert own ai generations" on public.ai_generations;
create policy "Users can insert own ai generations"
on public.ai_generations for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own ai generations" on public.ai_generations;
create policy "Users can update own ai generations"
on public.ai_generations for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own ai generations" on public.ai_generations;
create policy "Users can delete own ai generations"
on public.ai_generations for delete
using (user_id = auth.uid());

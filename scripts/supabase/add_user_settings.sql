create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  text_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

drop policy if exists "Users can select own settings" on public.user_settings;
create policy "Users can select own settings"
on public.user_settings for select
using (user_id = auth.uid());

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
on public.user_settings for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
on public.user_settings for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own settings" on public.user_settings;
create policy "Users can delete own settings"
on public.user_settings for delete
using (user_id = auth.uid());

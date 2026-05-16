-- Destructive cleanup for existing Phase 1 databases.
-- Run this once after deploying the app change that removes draft/paused stories.

begin;

update public.stories
set status = 'active'
where status in ('draft', 'paused');

alter table public.stories
alter column status set default 'active';

alter table public.stories
drop constraint if exists stories_status_check;

alter table public.stories
add constraint stories_status_check
check (status in ('active', 'completed', 'archived'));

commit;

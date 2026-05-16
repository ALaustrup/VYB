-- Run in Supabase SQL editor after enabling Realtime on `messages`.
-- Clerk remains the app auth source; these policies gate anon Realtime reads by room membership
-- when you map Supabase auth users to app user ids (optional follow-up).

alter table public.messages enable row level security;
alter table public.chat_room_members enable row level security;

-- Drop existing policies if re-applying
drop policy if exists "messages_select_member" on public.messages;
drop policy if exists "messages_insert_member" on public.messages;
drop policy if exists "room_members_select_own" on public.chat_room_members;

-- Members can read messages in rooms they belong to
create policy "messages_select_member"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.chat_room_members m
      where m.room_id = messages.room_id
        and m.user_id = auth.uid()::text
    )
  );

-- Members can insert their own messages
create policy "messages_insert_member"
  on public.messages
  for insert
  with check (
    user_id = auth.uid()::text
    and exists (
      select 1
      from public.chat_room_members m
      where m.room_id = messages.room_id
        and m.user_id = auth.uid()::text
    )
  );

create policy "room_members_select_own"
  on public.chat_room_members
  for select
  using (user_id = auth.uid()::text);

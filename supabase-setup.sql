-- ============================================================
-- OwnScape Supabase Setup: RLS Policies & Storage Configuration
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- ============================================================
-- Safe to run repeatedly — drops existing policies first.
-- Casts auth.uid()::text to match columns that may be uuid or text.

-- -------------------------------------------------------
-- 1. Enable Row-Level Security on all tables
-- -------------------------------------------------------
alter table if exists "Users" enable row level security;
alter table if exists "Posts" enable row level security;
alter table if exists "Comments" enable row level security;
alter table if exists "Follows" enable row level security;
alter table if exists "Likes" enable row level security;
alter table if exists "Notifications" enable row level security;

-- -------------------------------------------------------
-- 2. Users
-- -------------------------------------------------------
drop policy if exists "Users are publicly viewable" on "Users";
drop policy if exists "Users can insert their own row" on "Users";
drop policy if exists "Users can update their own row" on "Users";
drop policy if exists "Users can delete their own row" on "Users";

create policy "Users are publicly viewable"
  on "Users" for select
  using (true);

create policy "Users can insert their own row"
  on "Users" for insert
  with check (cast(auth.uid() as text) = cast(id as text));

create policy "Users can update their own row"
  on "Users" for update
  using (cast(auth.uid() as text) = cast(id as text))
  with check (cast(auth.uid() as text) = cast(id as text));

create policy "Users can delete their own row"
  on "Users" for delete
  using (cast(auth.uid() as text) = cast(id as text));

-- -------------------------------------------------------
-- 3. Posts
-- -------------------------------------------------------
drop policy if exists "Posts are publicly viewable" on "Posts";
drop policy if exists "Authenticated users can create posts" on "Posts";
drop policy if exists "Authors can update their own posts" on "Posts";
drop policy if exists "Authors can delete their own posts" on "Posts";

create policy "Posts are publicly viewable"
  on "Posts" for select
  using (true);

create policy "Authenticated users can create posts"
  on "Posts" for insert
  with check (cast(auth.uid() as text) = cast(author_id as text));

create policy "Authors can update their own posts"
  on "Posts" for update
  using (cast(auth.uid() as text) = cast(author_id as text))
  with check (cast(auth.uid() as text) = cast(author_id as text));

-- -------------------------------------------------------
-- 3b. RPC functions for like/share counts (bypass RLS via security definer)
-- -------------------------------------------------------
create or replace function increment_like_count(post_id bigint)
returns void
language plpgsql
security definer
as $$
begin
  update "Posts"
  set like_count = coalesce(like_count, 0) + 1
  where id = post_id;
end;
$$;

create or replace function decrement_like_count(post_id bigint)
returns void
language plpgsql
security definer
as $$
begin
  update "Posts"
  set like_count = greatest(0, coalesce(like_count, 0) - 1)
  where id = post_id;
end;
$$;

create policy "Authors can delete their own posts"
  on "Posts" for delete
  using (cast(auth.uid() as text) = cast(author_id as text));

-- -------------------------------------------------------
-- 4. Comments (no author_id / post_id columns yet)
-- -------------------------------------------------------
drop policy if exists "Comments are publicly viewable" on "Comments";
drop policy if exists "Authenticated users can comment" on "Comments";

create policy "Comments are publicly viewable"
  on "Comments" for select
  using (true);

create policy "Authenticated users can comment"
  on "Comments" for insert
  with check (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- 5. Follows
-- -------------------------------------------------------
drop policy if exists "Follows are publicly viewable" on "Follows";
drop policy if exists "Authenticated users can follow" on "Follows";
drop policy if exists "Users can unfollow themselves" on "Follows";

create policy "Follows are publicly viewable"
  on "Follows" for select
  using (true);

create policy "Authenticated users can follow"
  on "Follows" for insert
  with check (cast(auth.uid() as text) = cast(follower_id as text));

create policy "Users can unfollow themselves"
  on "Follows" for delete
  using (cast(auth.uid() as text) = cast(follower_id as text));

-- -------------------------------------------------------
-- 6. Likes
-- -------------------------------------------------------
drop policy if exists "Likes are publicly viewable" on "Likes";
drop policy if exists "Authenticated users can like" on "Likes";
drop policy if exists "Users can remove their own likes" on "Likes";

create policy "Likes are publicly viewable"
  on "Likes" for select
  using (true);

create policy "Authenticated users can like"
  on "Likes" for insert
  with check (cast(auth.uid() as text) = cast(user_id as text));

create policy "Users can remove their own likes"
  on "Likes" for delete
  using (cast(auth.uid() as text) = cast(user_id as text));

-- -------------------------------------------------------
-- 7. Notifications
-- -------------------------------------------------------
drop policy if exists "Notifications are viewable by recipient" on "Notifications";
drop policy if exists "Authenticated users can create notifications" on "Notifications";
drop policy if exists "Recipients can mark notifications as read" on "Notifications";

create policy "Notifications are viewable by recipient"
  on "Notifications" for select
  using (cast(auth.uid() as text) = cast(recipient_id as text));

create policy "Authenticated users can create notifications"
  on "Notifications" for insert
  with check (auth.role() = 'authenticated');

create policy "Recipients can mark notifications as read"
  on "Notifications" for update
  using (cast(auth.uid() as text) = cast(recipient_id as text))
  with check (cast(auth.uid() as text) = cast(recipient_id as text));

-- -------------------------------------------------------
-- 8. Storage bucket policies (for the 'Post' bucket)
-- -------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('Post', 'Post', true)
on conflict (id) do nothing;

drop policy if exists "Public read access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;

create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'Post');

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'Post'
    and auth.role() = 'authenticated'
  );

create policy "Users can delete their own files"
  on storage.objects for delete
  using (
    bucket_id = 'Post'
    and cast(auth.uid() as text) = cast((storage.foldername(name))[1] as text)
  );

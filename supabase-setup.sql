-- ============================================================
-- OWNSCAPE — Supabase Setup SQL
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- ============================================================

-- 1. Users table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS "Users" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email VARCHAR NOT NULL,
  user_handle TEXT NOT NULL UNIQUE,
  user_bio TEXT,
  follower_count INT4 DEFAULT 0,
  following_count INT4 NOT NULL DEFAULT 0,
  "isPublic" BOOL NOT NULL DEFAULT true,
  user_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_handle ON "Users"(user_handle);

-- 2. Posts table
CREATE TABLE IF NOT EXISTS "Posts" (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  handle TEXT NOT NULL,
  storage_key TEXT,
  cached_until INT2,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  like_count INT4 NOT NULL DEFAULT 0,
  share_count INT4 NOT NULL DEFAULT 0,
  description TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON "Posts"(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON "Posts"(created_at DESC);

-- 3. Comments table (with FK to Posts and Users)
CREATE TABLE IF NOT EXISTS "Comments" (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  comment_body TEXT NOT NULL,
  post_id BIGINT NOT NULL REFERENCES "Posts"(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON "Comments"(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON "Comments"(author_id);

-- 4. Enable Row Level Security
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — Users
CREATE POLICY "Users are publicly viewable" ON "Users"
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own row" ON "Users"
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own row" ON "Users"
  FOR UPDATE USING (auth.uid() = id);

-- 6. RLS Policies — Posts
CREATE POLICY "Posts are publicly viewable" ON "Posts"
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON "Posts"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own posts" ON "Posts"
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON "Posts"
  FOR DELETE USING (auth.uid() = author_id);

-- 7. RLS Policies — Comments
CREATE POLICY "Comments are publicly viewable" ON "Comments"
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON "Comments"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own comments" ON "Comments"
  FOR DELETE USING (auth.uid() = author_id);

-- 8. Storage: Create the post-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to post-images
CREATE POLICY "Public can view post images" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images'
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images'
    AND auth.uid() = owner
  );

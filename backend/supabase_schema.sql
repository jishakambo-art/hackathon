-- DailyBrief Database Schema for Supabase
-- Run this in the Supabase SQL editor to create the tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Substack Sources (user's prioritized newsletters)
create table substack_sources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  publication_id text not null,
  publication_name text not null,
  subdomain text,
  priority integer check (priority >= 1 and priority <= 5),
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, publication_id)
);

-- RSS Sources
create table rss_sources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  name text not null,
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- News Topics (for Perplexity queries)
create table news_topics (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  topic text not null,
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Generation Logs
create table generation_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  scheduled_at timestamp with time zone not null,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  status text check (status in ('scheduled', 'fetching', 'generating', 'complete', 'failed')) default 'scheduled',
  notebook_id text,
  sources_used jsonb,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Credentials (encrypted OAuth tokens)
create table user_credentials (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  substack_access_token text,
  substack_refresh_token text,
  notebooklm_session jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Preferences
create table user_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  podcast_style text default 'deep-dive',
  podcast_length text default 'medium',
  language text default 'en',
  timezone text default 'America/Los_Angeles',
  daily_generation_enabled boolean default false,
  generation_time time default '07:00:00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies
alter table substack_sources enable row level security;
alter table rss_sources enable row level security;
alter table news_topics enable row level security;
alter table generation_logs enable row level security;
alter table user_credentials enable row level security;
alter table user_preferences enable row level security;

-- Users can only access their own data
create policy "Users can view own substack_sources" on substack_sources for select using (auth.uid() = user_id);
create policy "Users can insert own substack_sources" on substack_sources for insert with check (auth.uid() = user_id);
create policy "Users can update own substack_sources" on substack_sources for update using (auth.uid() = user_id);
create policy "Users can delete own substack_sources" on substack_sources for delete using (auth.uid() = user_id);

create policy "Users can view own rss_sources" on rss_sources for select using (auth.uid() = user_id);
create policy "Users can insert own rss_sources" on rss_sources for insert with check (auth.uid() = user_id);
create policy "Users can update own rss_sources" on rss_sources for update using (auth.uid() = user_id);
create policy "Users can delete own rss_sources" on rss_sources for delete using (auth.uid() = user_id);

create policy "Users can view own news_topics" on news_topics for select using (auth.uid() = user_id);
create policy "Users can insert own news_topics" on news_topics for insert with check (auth.uid() = user_id);
create policy "Users can update own news_topics" on news_topics for update using (auth.uid() = user_id);
create policy "Users can delete own news_topics" on news_topics for delete using (auth.uid() = user_id);

create policy "Users can view own generation_logs" on generation_logs for select using (auth.uid() = user_id);
create policy "Users can insert own generation_logs" on generation_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own generation_logs" on generation_logs for update using (auth.uid() = user_id);

create policy "Users can view own user_credentials" on user_credentials for select using (auth.uid() = user_id);
create policy "Users can insert own user_credentials" on user_credentials for insert with check (auth.uid() = user_id);
create policy "Users can update own user_credentials" on user_credentials for update using (auth.uid() = user_id);

create policy "Users can view own user_preferences" on user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own user_preferences" on user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own user_preferences" on user_preferences for update using (auth.uid() = user_id);

-- Indexes for performance
create index idx_substack_sources_user_id on substack_sources(user_id);
create index idx_substack_sources_priority on substack_sources(user_id, priority) where priority is not null;
create index idx_rss_sources_user_id on rss_sources(user_id);
create index idx_news_topics_user_id on news_topics(user_id);
create index idx_generation_logs_user_id on generation_logs(user_id);
create index idx_generation_logs_status on generation_logs(status);

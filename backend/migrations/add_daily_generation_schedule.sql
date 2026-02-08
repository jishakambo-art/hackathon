-- Migration: Add daily generation scheduling fields to user_preferences
-- Run this in Supabase SQL editor to update existing tables

-- Add new columns to user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS daily_generation_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS generation_time time DEFAULT '07:00:00';

-- Update existing rows to have default values
UPDATE user_preferences
SET
  daily_generation_enabled = false,
  generation_time = '07:00:00'
WHERE
  daily_generation_enabled IS NULL
  OR generation_time IS NULL;

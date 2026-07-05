-- Create admin user
-- Run this in Supabase Studio SQL Editor after verifying tables exist

INSERT INTO "users" ("username", "email", "password", "first_name", "last_name", "role", "is_active")
VALUES (
  'admin',
  'admin@gymgenie.com',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  'Admin',
  'User',
  'admin',
  true
) ON CONFLICT ("username") DO NOTHING;

INSERT INTO "users" ("username", "email", "password", "first_name", "last_name", "role", "is_active")
VALUES (
  'manager',
  'manager@gymgenie.com',
  '6ee4aefcd4a486d75b8e4b36e3afa9ab65e7a6f5d115b7e4e8f8c3d2b1a0908',
  'Manager',
  'User',
  'manager',
  true
) ON CONFLICT ("username") DO NOTHING;
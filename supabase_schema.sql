-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS Table
-- Note: Supabase handles auth.users. We will create a public.users table that references it 
-- or just use auth.users. However, for application data, it's common to have a public profile table.
-- Given the requirements "Users can have many Favorites", we usually link to auth.users.
-- I will create a profiles table (often called 'users' in public schema) to store user data if needed, 
-- but strictly following "Tables: Users", I will assume a public table for application-level user data 
-- linked to auth.users.

create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on users
alter table public.users enable row level security;

-- USERS RLS
create policy "Public profiles are viewable by everyone."
  on public.users for select
  using ( true );

create policy "Users can insert their own profile."
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

-- CATEGORIES Table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on categories
alter table public.categories enable row level security;

-- CATEGORIES RLS
create policy "Categories are viewable by everyone."
  on public.categories for select
  using ( true );

-- Only service role (admin) can insert/update/delete categories usually.
-- We can leave it read-only for authenticated users for now.


-- PLACES Table
create table public.places (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  address text,
  image_url text,
  category_id uuid references public.categories(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
  -- Assuming places are managed by admins or public? 
  -- "Users can read all Places". 
);

-- Enable RLS on places
alter table public.places enable row level security;

-- PLACES RLS
create policy "Places are viewable by everyone."
  on public.places for select
  using ( true );

-- FAVORITES Table (Many-to-Many between Users and Places)
create table public.favorites (
  user_id uuid references public.users(id) not null,
  place_id uuid references public.places(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, place_id)
);

-- Enable RLS on favorites
alter table public.favorites enable row level security;

-- FAVORITES RLS
create policy "Users can view their own favorites."
  on public.favorites for select
  using ( auth.uid() = user_id );

create policy "Users can create their own favorites."
  on public.favorites for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own favorites."
  on public.favorites for delete
  using ( auth.uid() = user_id );


-- Secure the tables
revoke all on public.users from anon, authenticated;
grant select on public.users to anon, authenticated;
grant insert, update on public.users to authenticated;

revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;

revoke all on public.places from anon, authenticated;
grant select on public.places to anon, authenticated;

revoke all on public.favorites from anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;

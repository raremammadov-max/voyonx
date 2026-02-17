# Supabase Deployment Instructions for Voyonx

## Prerequisites
1. Create a Supabase account at [supabase.com](https://supabase.com).
2. Create a new project.

## Step 1: Deploy Schema
1. Go to your Supabase Project Dashboard.
2. Navigate to the **SQL Editor** (icon on the left sidebar).
3. Click **New Query**.
4. Copy the content of `supabase_schema.sql` and paste it into the query editor.
5. Click **Run**.

## Step 2: Verify Tables
1. Go to the **Table Editor** (icon on the left sidebar).
2. Ensure you see the following tables:
   - `users`
   - `categories`
   - `places`
   - `favorites`
3. Check that RLS (Row Level Security) is enabled for all tables (you should see a padlock icon or "RLS Enabled" badge).

## Step 3: Insert Mock Data (Optional but recommended for testing)
You can run this in the SQL Editor to add some categories and places:

```sql
-- Insert Categories
INSERT INTO public.categories (name, slug) VALUES 
('Restaurants', 'restaurants'),
('Parks', 'parks'),
('Museums', 'museums');

-- Insert Places (Replace CATEGORY_ID with actual UUIDs from above if needed, or use subqueries)
INSERT INTO public.places (name, description, category_id) 
SELECT 'Central Park', 'A large public park in NYC', id FROM public.categories WHERE slug = 'parks';

INSERT INTO public.places (name, description, category_id) 
SELECT 'The Met', 'The Metropolitan Museum of Art', id FROM public.categories WHERE slug = 'museums';
```

## Step 4: Testing Queries
1. Use the queries in `supabase_queries.sql` in the SQL Editor.
2. Note: To test RLS policies effectively in the SQL Editor, you may need to impersonate a user or explicitly set the role, but for basic syntax checking, they will work.

## Next Steps for Application Integration
- Get your **Project URL** and **anon public key** from Project Settings > API.
- You will need these for the frontend/backend integration.

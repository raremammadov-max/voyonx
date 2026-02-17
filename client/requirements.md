## Packages
@supabase/supabase-js | Supabase client for authentication and data fetching
framer-motion | For beautiful page transitions and micro-interactions

## Notes
Supabase Auth handles login/signup.
Profile data is fetched from public.users table joined with auth.users via RLS.
Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.

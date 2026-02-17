-- 1. Add favorite
-- Assumes you have the user's UUID (e.g., from auth.uid()) and the place's UUID
INSERT INTO public.favorites (user_id, place_id)
VALUES ('USER_UUID_HERE', 'PLACE_UUID_HERE');

-- 2. Remove favorite
DELETE FROM public.favorites
WHERE user_id = 'USER_UUID_HERE' AND place_id = 'PLACE_UUID_HERE';

-- 3. Get user's favorites
-- Joins with places and categories to get full details
SELECT 
  p.id as place_id,
  p.name as place_name,
  p.description,
  p.image_url,
  c.name as category_name,
  f.created_at as favorited_at
FROM public.favorites f
JOIN public.places p ON f.place_id = p.id
LEFT JOIN public.categories c ON p.category_id = c.id
WHERE f.user_id = 'USER_UUID_HERE'
ORDER BY f.created_at DESC;

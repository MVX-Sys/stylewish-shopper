UPDATE public.hero_slides
SET media_url = regexp_replace(split_part(media_url, '?', 1), '^.*/object/(?:sign|public)/product-images/', '')
WHERE media_url LIKE 'http%/object/%/product-images/%';
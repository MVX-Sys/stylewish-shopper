-- Secure the functions by setting search_path and revoking execution
ALTER FUNCTION public.generate_product_hash_id() SET search_path = public;
ALTER FUNCTION public.generate_category_hash_id() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.generate_product_hash_id() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.generate_category_hash_id() FROM PUBLIC, authenticated, anon;
CREATE OR REPLACE FUNCTION public.set_produtos_ordem(_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.produtos p
  SET ordem = t.ord
  FROM (SELECT id, ordinality::int AS ord FROM unnest(_ids) WITH ORDINALITY AS u(id, ordinality)) t
  WHERE p.id = t.id AND p.ordem IS DISTINCT FROM t.ord;
END;
$$;

REVOKE ALL ON FUNCTION public.set_produtos_ordem(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.set_produtos_ordem(uuid[]) TO authenticated;
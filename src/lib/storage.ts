import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; expires: number }>();

export async function getImageUrl(path: string | null | undefined): Promise<string> {
  if (!path) return "";
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.expires > now + 60_000) return hit.url;
  const { data } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, 60 * 60);
  const url = data?.signedUrl ?? "";
  if (url) cache.set(path, { url, expires: now + 55 * 60_000 });
  return url;
}

export async function getImageUrls(paths: (string | null | undefined)[]): Promise<string[]> {
  return Promise.all(paths.map((p) => getImageUrl(p)));
}

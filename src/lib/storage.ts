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

function sanitize(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "imagem";
}

function extFromUrl(url: string, fallback = "jpg") {
  try {
    const pathname = new URL(url).pathname;
    const m = pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
    if (m) return m[1].toLowerCase();
  } catch {}
  return fallback;
}

export async function downloadImage(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao baixar imagem");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  const ext = extFromUrl(url, blob.type.split("/")[1] || "jpg");
  a.download = `${sanitize(filename)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

export async function downloadImagesAsZip(
  urls: string[],
  baseName: string,
) {
  if (urls.length === 0) return;
  if (urls.length === 1) {
    return downloadImage(urls[0], baseName);
  }
  const [{ default: JSZip }] = await Promise.all([import("jszip")]);
  const zip = new JSZip();
  const folder = zip.folder(sanitize(baseName)) ?? zip;
  await Promise.all(
    urls.map(async (u, i) => {
      const res = await fetch(u);
      if (!res.ok) return;
      const blob = await res.blob();
      const ext = extFromUrl(u, blob.type.split("/")[1] || "jpg");
      folder.file(`${sanitize(baseName)}-${String(i + 1).padStart(2, "0")}.${ext}`, blob);
    }),
  );
  const content = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${sanitize(baseName)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

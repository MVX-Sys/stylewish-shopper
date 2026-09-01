import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; expires: number }>();

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'origin';
  resize?: 'cover' | 'contain' | 'fill';
}

export async function getImageUrl(
  path: string | null | undefined,
  options?: ImageOptions
): Promise<string> {
  if (!path) return "";
  
  const cacheKey = options ? `${path}:${JSON.stringify(options)}` : path;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > now + 60_000) return hit.url;

  // Try to use a signed URL if we're not sure if the bucket is public,
  // or use getPublicUrl if we're certain it's public.
  // Force a fresh session check to ensure we have the latest auth token for the request
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  
  // Use createSignedUrl to ensure access to the private bucket
  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, 3600); // 1 hour expiry
    
  if (error) {
    console.error("Error generating signed URL for", path, error);
    // Fallback to public URL only if signed URL fails, though bucket is private
    const { data: publicData } = supabase.storage.from("product-images").getPublicUrl(path);
    return publicData?.publicUrl ?? "";
  }
    
  const url = data?.signedUrl ?? "";
  if (url) cache.set(cacheKey, { url, expires: now + 55 * 60_000 });
  return url;
}

export async function getImageUrls(paths: (string | null | undefined)[]): Promise<string[]> {
  return Promise.all(paths.map((p) => getImageUrl(p)));
}

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `uploads/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
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

/**
 * Baixa um arquivo .zip contendo as imagens de todos os produtos do pedido,
 * organizadas em uma pasta por produto.
 */
export async function downloadOrderImagesZip(
  items: { produtoId: string; nome: string; foto?: string | null }[],
  baseName = "imagens-pedido",
): Promise<boolean> {
  if (items.length === 0) return false;

  // Produtos únicos do pedido
  const produtos = new Map<string, string>();
  for (const i of items) if (!produtos.has(i.produtoId)) produtos.set(i.produtoId, i.nome);

  // Busca todas as imagens dos produtos no banco
  const ids = [...produtos.keys()];
  let paths = new Map<string, string[]>();
  try {
    const { data } = await supabase
      .from("imagens_produto")
      .select("produto_id,storage_path,principal,ordem")
      .in("produto_id", ids)
      .order("ordem");
    for (const row of data ?? []) {
      const list = paths.get(row.produto_id) ?? [];
      list.push(row.storage_path);
      paths.set(row.produto_id, list);
    }
  } catch (e) {
    console.error("Erro ao buscar imagens do pedido:", e);
  }

  // Fallback: foto já presente no item do carrinho
  for (const i of items) {
    if (!paths.get(i.produtoId)?.length && i.foto) paths.set(i.produtoId, [i.foto]);
  }

  const [{ default: JSZip }] = await Promise.all([import("jszip")]);
  const zip = new JSZip();
  let count = 0;

  await Promise.all(
    [...produtos.entries()].map(async ([produtoId, nome]) => {
      const list = paths.get(produtoId) ?? [];
      if (list.length === 0) return;
      const folder = zip.folder(sanitize(nome)) ?? zip;
      await Promise.all(
        list.map(async (p, idx) => {
          try {
            const url = await getImageUrl(p);
            if (!url) return;
            const res = await fetch(url);
            if (!res.ok) return;
            const blob = await res.blob();
            const ext = extFromUrl(p, blob.type.split("/")[1] || "jpg");
            folder.file(`${sanitize(nome)}-${String(idx + 1).padStart(2, "0")}.${ext}`, blob);
            count++;
          } catch (e) {
            console.error("Erro ao adicionar imagem no zip:", e);
          }
        }),
      );
    }),
  );

  if (count === 0) return false;

  const content = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(content);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = objectUrl;
  a.download = `${sanitize(baseName)}-${stamp}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  return true;
}

// Client-callable server functions for storage in the external Supabase project.
// Storage RLS policies are not available there, so uploads and signed URLs run
// through the service-role server client (never exposed to the browser).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_BUCKETS = ["product-images", "atendentes-v1-private"] as const;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function assertBucket(bucket: string) {
  if (!(ALLOWED_BUCKETS as readonly string[]).includes(bucket)) {
    throw new Error("Bucket não permitido");
  }
}

function assertPath(path: string) {
  if (!path || path.includes("..") || path.startsWith("/") || path.length > 512) {
    throw new Error("Caminho de arquivo inválido");
  }
}

async function adminStorage() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin.storage;
}

export async function fileToBase64(file: File | Blob): Promise<string> {
  const arr = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    bin += String.fromCharCode(...arr.subarray(i, i + chunk));
  }
  return btoa(bin);
}

const uploadSchema = z.object({
  bucket: z.string(),
  path: z.string().min(1),
  contentType: z.string().min(3).max(100),
  base64: z.string().min(1),
  cacheControl: z.string().max(20).optional(),
  upsert: z.boolean().optional(),
});

export const uploadFileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data }) => {
    assertBucket(data.bucket);
    assertPath(data.path);

    const bin = atob(data.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.length === 0) throw new Error("Arquivo vazio");
    if (bytes.length > MAX_BYTES) throw new Error("Arquivo muito grande (máximo 8 MB)");

    const storage = await adminStorage();
    const { error } = await storage.from(data.bucket).upload(data.path, bytes, {
      contentType: data.contentType,
      cacheControl: data.cacheControl ?? "31536000",
      upsert: data.upsert ?? false,
    });
    if (error) throw new Error(error.message);
    return { path: data.path };
  });

const signSchema = z.object({
  bucket: z.string(),
  paths: z.array(z.string().min(1).max(512)).min(1).max(60),
  expiresIn: z.number().int().min(60).max(60 * 60 * 24 * 7).optional(),
});

export const signFilesFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signSchema.parse(d))
  .handler(async ({ data }) => {
    assertBucket(data.bucket);
    const storage = await adminStorage();
    const out: Record<string, string> = {};
    const ttl = data.expiresIn ?? 60 * 60 * 24;
    await Promise.all(
      [...new Set(data.paths)].map(async (p) => {
        assertPath(p);
        try {
          const { data: signed } = await storage.from(data.bucket).createSignedUrl(p, ttl);
          if (signed?.signedUrl) out[p] = signed.signedUrl;
        } catch {
          /* ignora caminho individual */
        }
      }),
    );
    return out;
  });

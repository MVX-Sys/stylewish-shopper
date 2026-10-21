import { useEffect, useState } from "react";
import { signFilesFn } from "@/lib/storage-files.functions";

const cache = new Map<string, string>();

const keyOf = (bucket: string, path: string, expiresIn: number) =>
  `${bucket}|${path}|${expiresIn}`;

/** Signed URL for a private-bucket file, fetched through the server (service key). */
export function useSignedFileUrl(
  bucket: string,
  path: string | null | undefined,
  expiresIn = 3600,
) {
  const [url, setUrl] = useState<string>(() =>
    path ? cache.get(keyOf(bucket, path, expiresIn)) ?? "" : "",
  );

  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl("");
      return;
    }
    const key = keyOf(bucket, path, expiresIn);
    const cached = cache.get(key);
    if (cached) {
      setUrl(cached);
      return;
    }
    signFilesFn({ data: { bucket, paths: [path], expiresIn } })
      .then((out) => {
        const u = out?.[path] ?? "";
        if (u) cache.set(key, u);
        if (alive) setUrl(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [bucket, path, expiresIn]);

  return url;
}

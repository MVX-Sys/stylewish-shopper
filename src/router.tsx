import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Após uma nova publicação, abas abertas podem pedir arquivos antigos que não existem mais.
// Recarrega a página uma vez para buscar a versão nova em vez de mostrar tela branca.
if (typeof window !== "undefined" && !(window as any).__chunkReloadHandler) {
  (window as any).__chunkReloadHandler = true;
  const reloadOnce = () => {
    const key = "chunk-reload-at";
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last > 10000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  };
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    reloadOnce();
  });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e.reason as any)?.message ?? e.reason ?? "");
    if (/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) {
      reloadOnce();
    }
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 600000,
    defaultStaleTime: 300000,
    defaultPreloadDelay: 50,
  });

  return router;
};

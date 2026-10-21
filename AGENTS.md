<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Full site CSV exports use an explicit table/column registry and admin-verified paginated server functions; user-directory exports omit credentials, and product media downloads use the browser's authenticated Storage client to avoid exposing privileged storage access.
- The project uses an EXTERNAL Supabase (MVX-Sys's Project), not Lovable Cloud: never propose enabling Lovable Cloud or use Lovable supabase--* tools here. Unprefixed env (SUPABASE_*) does not exist; server code falls back to `import.meta.env.VITE_SUPABASE_URL` / hardcoded URL and the `MVX_SERVICE_ROLE_KEY` secret. Publishing is required for secret changes to reach production.
- Storage buckets (product-images, atendentes-v1-private) are private with no remotely-manageable RLS: all uploads and signed-URL generation go through server functions in src/lib/storage-files.functions.ts; do not reintroduce direct browser storage writes. SQL (DDL/policies/triggers) still requires the user to run it in the Supabase SQL Editor.


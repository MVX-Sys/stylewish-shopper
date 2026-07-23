import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone: string | null;
  roles: string[];
};

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    // Verify caller is admin using their own RLS-scoped client
    const { data: isAdminRow, error: adminErr } = await context.supabase.rpc(
      "has_role",
      { _user_id: context.userId, _role: "admin" },
    );
    if (adminErr) throw new Error(adminErr.message);
    if (!isAdminRow) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const perPage = 200;
    let page = 1;
    const users: Array<{
      id: string;
      email: string | null;
      created_at: string;
      last_sign_in_at: string | null;
      email_confirmed_at: string | null;
      phone: string | null;
    }> = [];

    // Paginate through all users
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw new Error(error.message);
      for (const u of data.users) {
        users.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          email_confirmed_at: u.email_confirmed_at ?? null,
          phone: u.phone ?? null,
        });
      }
      if (data.users.length < perPage) break;
      page += 1;
      if (page > 25) break; // safety cap
    }

    const { data: rolesRows, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesErr) throw new Error(rolesErr.message);

    const rolesByUser = new Map<string, string[]>();
    for (const r of rolesRows ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }

    return users
      .map((u) => ({ ...u, roles: rolesByUser.get(u.id) ?? [] }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });

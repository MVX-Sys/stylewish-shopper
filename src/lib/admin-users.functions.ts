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
  permissions: string[];
};

async function assertAdmin(ctx: {
  supabase: any;
  userId: string;
}) {
  const { data: isAdminRow, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdminRow) throw new Response("Forbidden", { status: 403 });
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context);

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
      if (page > 25) break;
    }

    const [{ data: rolesRows, error: rolesErr }, { data: permRows, error: permErr }] =
      await Promise.all([
        supabaseAdmin.from("user_roles").select("user_id, role"),
        supabaseAdmin.from("user_permissions").select("user_id, permission"),
      ]);
    if (rolesErr) throw new Error(rolesErr.message);
    if (permErr) throw new Error(permErr.message);

    const rolesByUser = new Map<string, string[]>();
    for (const r of rolesRows ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }
    const permsByUser = new Map<string, string[]>();
    for (const p of permRows ?? []) {
      const arr = permsByUser.get(p.user_id) ?? [];
      arr.push(p.permission);
      permsByUser.set(p.user_id, arr);
    }

    return users
      .map((u) => ({
        ...u,
        roles: rolesByUser.get(u.id) ?? [],
        permissions: permsByUser.get(u.id) ?? [],
      }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });

const VALID_ROLES = new Set(["admin", "funcionario", "cliente"]);
const VALID_PERMISSIONS = new Set([
  "produtos.manage",
  "solicitacoes.manage",
  "auditoria.view",
  "backup.manage",
  "usuarios.manage",
]);

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { userId: string; role: "admin" | "funcionario" | "cliente" }) => {
      if (!data?.userId || typeof data.userId !== "string")
        throw new Error("userId inválido");
      if (!VALID_ROLES.has(data.role)) throw new Error("Papel inválido");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    // Prevent self-demotion of the last admin: block admins from removing their own admin role
    if (data.userId === context.userId && data.role !== "admin") {
      throw new Response(
        "Você não pode remover seu próprio acesso de administrador.",
        { status: 400 },
      );
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Remove all existing app_role rows for the user
    const { error: delErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (delErr) throw new Error(delErr.message);

    if (data.role === "admin" || data.role === "funcionario") {
      const { error: insErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (insErr) throw new Error(insErr.message);
    }

    // Clear permissions when moving away from funcionario
    if (data.role !== "funcionario") {
      const { error: permErr } = await supabaseAdmin
        .from("user_permissions")
        .delete()
        .eq("user_id", data.userId);
      if (permErr) throw new Error(permErr.message);
    }

    return { ok: true };
  });

export const setUserPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { userId: string; permissions: string[] }) => {
      if (!data?.userId || typeof data.userId !== "string")
        throw new Error("userId inválido");
      if (!Array.isArray(data.permissions))
        throw new Error("permissions inválidas");
      for (const p of data.permissions) {
        if (!VALID_PERMISSIONS.has(p)) throw new Error(`Permissão inválida: ${p}`);
      }
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { error: delErr } = await supabaseAdmin
      .from("user_permissions")
      .delete()
      .eq("user_id", data.userId);
    if (delErr) throw new Error(delErr.message);

    if (data.permissions.length > 0) {
      const rows = data.permissions.map((p) => ({
        user_id: data.userId,
        permission: p,
      }));
      const { error: insErr } = await supabaseAdmin
        .from("user_permissions")
        .insert(rows);
      if (insErr) throw new Error(insErr.message);
    }

    return { ok: true };
  });

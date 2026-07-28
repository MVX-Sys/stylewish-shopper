import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { classifyRole, type UserRoleKind } from "@/lib/permissions";

type AuthCtx = {
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  roleKind: UserRoleKind;
  permissions: string[];
  refreshRole: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleKind, setRoleKind] = useState<UserRoleKind>("cliente");
  const [permissions, setPermissions] = useState<string[]>([]);

  const checkRole = async (uid: string | undefined) => {
    if (!uid) {
      setRoleKind("cliente");
      setPermissions([]);
      return;
    }
    const [rolesRes, permsRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("user_permissions").select("permission").eq("user_id", uid),
    ]);
    const roles = (rolesRes.data ?? []).map((r) => r.role as string);
    setRoleKind(classifyRole(roles));
    setPermissions((permsRes.data ?? []).map((p) => p.permission as string));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      checkRole(data.session?.user.id).finally(() => setLoading(false));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      checkRole(s?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        loading,
        isAdmin: roleKind === "admin",
        roleKind,
        permissions,
        refreshRole: () => checkRole(session?.user.id),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be within AuthProvider");
  return c;
}

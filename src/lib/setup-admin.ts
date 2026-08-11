import { supabase } from "@/integrations/supabase/client";

export async function createAdminUser() {
  const email = "mvxsistemas@hotmail.com";
  const password = "mateus0209";

  console.log(`Tentando criar/verificar usuário: ${email}`);

  // 1. Verificar se o usuário já existe no auth
  // Nota: supabase.auth.admin.listUsers() só funciona com service_role,
  // mas aqui estamos no contexto do navegador ou server function restrita.
  // Vamos tentar dar signUp, se o usuário já existir o Supabase avisará (dependendo da config)
  // ou apenas ignoramos o erro de "usuário já existe".
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    if (signUpError.message.includes("already registered")) {
      console.log("Usuário já registrado no auth.");
    } else {
      console.error("Erro ao cadastrar usuário:", signUpError.message);
      return;
    }
  } else {
    console.log("Usuário cadastrado com sucesso.");
  }

  // 2. Tentar entrar para garantir que temos a sessão e o UID
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error("Erro ao entrar:", signInError.message);
    return;
  }

  const userId = signInData.user.id;
  console.log(`UID do usuário: ${userId}`);

  // 3. Adicionar o papel 'admin' na tabela user_roles
  // Precisamos garantir que a tabela user_roles e a função has_role existam.
  // Como as permissões de RLS podem bloquear o INSERT direto,
  // geralmente isso é feito via migração SQL.
  
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

  if (roleError) {
    console.error("Erro ao atribuir papel de admin:", roleError.message);
    console.log("Dica: Isso pode exigir privilégios de service_role ou uma migração SQL.");
  } else {
    console.log("Papel de admin atribuído com sucesso.");
  }
}

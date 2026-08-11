import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AdminSetup() {
  useEffect(() => {
    const setupAdmin = async () => {
      const email = "mvxsistemas@hotmail.com";
      const password = "mateus0209";

      // 1. Verificar se já existe alguém logado que seja esse admin
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.email === email) return;

      // 2. Tentar criar o usuário (signUp)
      // Nota: No Supabase, se o usuário já existe, o signUp pode retornar erro ou apenas não fazer nada
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError && !signUpError.message.includes("already registered")) {
        console.error("Erro ao cadastrar admin:", signUpError.message);
      }

      // Tentar entrar apenas para obter o UID e associar o papel de admin via RPC ou similar
      // Como já rodamos a migração SQL que tenta associar UID ao papel, 
      // precisamos apenas que o usuário exista.
      // Em um ambiente real, um trigger no auth.users faria isso automaticamente.


      // 3. O papel de admin é garantido pela migração SQL que associa o UID ao papel 'admin'
      // Mas para isso o usuário precisa existir primeiro. 
      // Como não temos o UID aqui facilmente sem logar, e não queremos deslogar o usuário atual,
      // a migração SQL que rodamos anteriormente é a forma correta, mas ela precisa do UID.
      
      // Vamos tentar buscar o UID desse email se possível (apenas se formos admin, o que é um paradoxo aqui)
      // Por isso, a instrução do usuário de "Criar um email administrativo" geralmente implica
      // que ele quer as credenciais prontas para USO, e que o sistema as reconheça.
    };

    setupAdmin();
  }, []);

  return null;
}

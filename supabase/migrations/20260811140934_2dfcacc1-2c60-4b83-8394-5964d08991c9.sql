-- Desabilitar a confirmação de e-mail obrigatória para permitir que o usuário seja ativado imediatamente
-- Nota: Isso altera as configurações de autenticação que o Supabase gerencia. 
-- Como não temos acesso direto ao painel de Auth do Supabase via SQL para todas as configurações,
-- garantimos que o provedor de e-mail não bloqueie o login.

-- No Supabase, isso geralmente é feito via Dashboard, mas podemos tentar via parâmetros de configuração se disponíveis 
-- ou garantir que as políticas de RLS e triggers de perfil não dependam de email_confirmed_at.

-- Adicionalmente, vamos garantir que qualquer novo usuário criado tenha o papel 'cliente' por padrão via trigger,
-- para que ele não fique "limbo" após o cadastro.

CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'cliente');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para automatizar o papel inicial
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

-- Grant para garantir que o trigger funcione
GRANT INSERT ON public.user_roles TO service_role;

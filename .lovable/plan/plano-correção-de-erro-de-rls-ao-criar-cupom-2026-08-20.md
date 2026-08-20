# Plano: Correção de Erro de RLS ao Criar Cupom

O usuário está enfrentando um erro `new row violates row-level security policy for table "cupons"` ao tentar criar um novo cupom. Embora eu já tenha aplicado uma migração para corrigir as políticas de RLS, o erro persiste. Isso geralmente acontece em aplicações TanStack Start quando o token de autenticação não é passado corretamente para a função de servidor ou quando a política de RLS depende de funções que não estão funcionando como esperado.

## Diagnóstico
1.  **Políticas de RLS**: As políticas atuais usam `public.has_role(auth.uid(), 'admin')`. Se o `auth.uid()` retornar nulo no servidor, a política falha.
2.  **Auth Middleware**: O `attachSupabaseAuth` está registrado no `src/start.ts`, o que deveria anexar o token.
3.  **Client-side auth**: No `src/lib/auth.tsx`, `supabase.auth.getUser()` é usado, o que é correto para garantir uma sessão válida.

## Ações Propostas

### 1. Backend: Reforçar a função de verificação de permissões
Vou revisar a função `has_role` para garantir que ela não falhe silenciosamente e que o esquema esteja correto.

### 2. Backend: Simplificar RLS para facilitar diagnóstico
Vou ajustar a política de RLS para permitir inserções se o usuário estiver autenticado e tiver o papel correto, garantindo que o `auth.uid()` esteja sendo capturado.

### 3. Frontend: Validar Sessão antes da Chamada
Garantir que a chamada para `saveCupon` no frontend ocorra apenas quando a sessão estiver plenamente carregada.

## Detalhes Técnicos
- Executar nova migração SQL para garantir que a função `has_role` seja `SECURITY DEFINER` e use `auth.uid()` de forma robusta.
- Adicionar logs no servidor (via `console.log`) na função `saveCupon` para verificar se o `userId` está presente no contexto (se estivermos usando middleware de autenticação do TanStack).
- Ajustar `src/lib/coupons.functions.ts` para usar o middleware de autenticação do Supabase explicitamente se necessário.

```sql
-- Exemplo de ajuste na política
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY DEFINER;
```

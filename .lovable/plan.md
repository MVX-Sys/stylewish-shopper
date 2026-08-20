# Plano de Correção do Sistema de Auditoria

O sistema de auditoria não está registrando as ações administrativas de funcionários e administradores porque a função `logAudit` não está sendo chamada em diversos fluxos críticos de gerenciamento (categorias, cupons, configurações do site, gerenciamento de usuários, etc.) e algumas chamadas existentes em componentes frontend podem falhar silenciosamente ou não capturar o contexto completo.

## Alterações Propostas

### 1. Reforçar o Utilitário de Auditoria
- Garantir que `logAudit` em `src/lib/audit.ts` seja robusto.
- Adicionar suporte a novas entidades e ações conforme necessário.

### 2. Implementar Auditoria em Fluxos Faltantes
Vou adicionar chamadas à função `logAudit` nos seguintes locais:

#### Gerenciamento de Categorias e Produtos
- **`src/components/product-form.tsx`**: Já possui auditoria, mas revisarei se cobre todos os casos de erro e sucesso.
- **`src/lib/products.functions.ts`** (se houver mutações lá): Adicionar registros de criação/edição/exclusão.

#### Gerenciamento de Cupons
- **`src/lib/coupons.functions.ts`**: Adicionar auditoria nas funções `saveCupon` e `deleteCupon`.

#### Gerenciamento de Usuários e Permissões
- **`src/lib/admin-users.functions.ts`**: Adicionar auditoria em `setUserRole`, `setUserPermissions` e `deleteUserAccess`.

#### Configurações do Site (Banners/Hero)
- **`src/lib/config-site.ts`**: Adicionar auditoria em `updateHeroSlide`, `createHeroSlide` e `deleteHeroSlide`.

#### Atendentes
- **`src/lib/atendentes.functions.ts`**: Adicionar auditoria em `createAtendente`, `updateAtendente` e `deleteAtendente`.

### 3. Registro de Login
- **`src/lib/auth.tsx`**: Adicionar um registro de auditoria quando um usuário faz login com sucesso no painel administrativo.

## Detalhes Técnicos
- As chamadas de auditoria serão feitas preferencialmente nas **Server Functions** (`.functions.ts`) para garantir que a ação foi processada pelo servidor antes de registrar o log.
- O `user_id` e `user_email` serão extraídos do contexto de autenticação do Supabase.
- Utilizaremos blocos `try-catch` para garantir que falhas no log de auditoria não interrompam o fluxo principal do usuário (como já está implementado em `audit.ts`).

## Verificação
- Após as alterações, realizarei ações de teste (criar um cupom, editar um atendente, etc.) e verificarei se os registros aparecem na aba "Avançado" e na aba "Auditoria".

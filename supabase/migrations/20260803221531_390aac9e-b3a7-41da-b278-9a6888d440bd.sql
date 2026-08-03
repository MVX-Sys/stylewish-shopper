
create table if not exists public.pedidos (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    total decimal(12,2) not null,
    status text not null default 'pendente',
    forma_envio text not null,
    forma_pagamento text not null,
    endereco jsonb,
    observacoes text,
    criado_em timestamptz default now()
);

create table if not exists public.pedidos_itens (
    id uuid primary key default gen_random_uuid(),
    pedido_id uuid references public.pedidos(id) on delete cascade not null,
    produto_id uuid references public.produtos(id) on delete set null,
    variacao_id uuid references public.variacoes_produto(id) on delete set null,
    quantidade integer not null,
    preco_unitario decimal(12,2) not null,
    detalhes jsonb
);

grant select, insert on public.pedidos to authenticated;
grant select, insert on public.pedidos_itens to authenticated;
grant all on public.pedidos to service_role;
grant all on public.pedidos_itens to service_role;

alter table public.pedidos enable row level security;
alter table public.pedidos_itens enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where policyname = 'Users can view own orders') then
        create policy "Users can view own orders" on public.pedidos for select to authenticated using (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can insert own orders') then
        create policy "Users can insert own orders" on public.pedidos for insert to authenticated with check (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can view own order items') then
        create policy "Users can view own order items" on public.pedidos_itens for select to authenticated using (exists (select 1 from public.pedidos where id = pedidos_itens.pedido_id and user_id = auth.uid()));
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can insert own order items') then
        create policy "Users can insert own order items" on public.pedidos_itens for insert to authenticated with check (exists (select 1 from public.pedidos where id = pedidos_itens.pedido_id and user_id = auth.uid()));
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Admins can manage all orders') then
        create policy "Admins can manage all orders" on public.pedidos for all to authenticated using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'funcionario'));
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Admins can manage all order items') then
        create policy "Admins can manage all order items" on public.pedidos_itens for all to authenticated using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'funcionario'));
    end if;
end
$$;

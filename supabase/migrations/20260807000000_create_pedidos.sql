-- Check if tables already exist to avoid errors
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pedidos') THEN
        CREATE TABLE public.pedidos (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at timestamptz DEFAULT now() NOT NULL,
            usuario_id uuid REFERENCES auth.users(id),
            cliente_nome text NOT NULL,
            cliente_whatsapp text NOT NULL,
            atendente_id uuid REFERENCES public.atendentes(id),
            total numeric NOT NULL,
            status text DEFAULT 'pendente' NOT NULL,
            forma_pagamento text,
            forma_envio text,
            observacoes text
        );

        GRANT SELECT, INSERT, UPDATE ON public.pedidos TO authenticated;
        GRANT ALL ON public.pedidos TO service_role;
        ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Admins can do everything on pedidos"
        ON public.pedidos
        FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

        CREATE POLICY "Users can see their own orders"
        ON public.pedidos
        FOR SELECT
        TO authenticated
        USING (auth.uid() = usuario_id);

        CREATE POLICY "Users can insert their own orders"
        ON public.pedidos
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = usuario_id OR usuario_id IS NULL);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pedidos_itens') THEN
        CREATE TABLE public.pedidos_itens (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
            produto_id uuid REFERENCES public.produtos(id),
            nome_produto text NOT NULL,
            quantidade integer NOT NULL,
            preco_unitario numeric NOT NULL,
            cor text,
            tamanho text,
            imagem_url text
        );

        GRANT SELECT, INSERT ON public.pedidos_itens TO authenticated;
        GRANT ALL ON public.pedidos_itens TO service_role;
        ALTER TABLE public.pedidos_itens ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Admins can see all items"
        ON public.pedidos_itens
        FOR SELECT
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

        CREATE POLICY "Users can see their own order items"
        ON public.pedidos_itens
        FOR SELECT
        TO authenticated
        USING (EXISTS (
            SELECT 1 FROM public.pedidos 
            WHERE pedidos.id = pedidos_itens.pedido_id 
            AND pedidos.usuario_id = auth.uid()
        ));
    END IF;
END $$;

-- Restaurar permissões se necessário (a tabela user_roles e user_permissions usa referências cascade, 
-- mas como o ID foi preservado ou o registro pode ter sido limpo, garantimos aqui)
DELETE FROM public.user_roles WHERE user_id = '36f7d9b2-cbd2-4b7c-853c-4c1d09260f71';
DELETE FROM public.user_permissions WHERE user_id = '36f7d9b2-cbd2-4b7c-853c-4c1d09260f71';

INSERT INTO public.user_roles (user_id, role) VALUES ('36f7d9b2-cbd2-4b7c-853c-4c1d09260f71', 'admin');

INSERT INTO public.user_permissions (user_id, permission) VALUES 
('36f7d9b2-cbd2-4b7c-853c-4c1d09260f71', 'produtos.manage'),
('36f7d9b2-cbd2-4b7c-853c-4c1d09260f71', 'solicitacoes.manage'),
('36f7d9b2-cbd2-4b7c-853c-4c1d09260f71', 'auditoria.view'),
('36f7d9b2-cbd2-4b7c-853c-4c1d09260f71', 'backup.manage'),
('36f7d9b2-cbd2-4b7c-853c-4c1d09260f71', 'usuarios.manage'),
('36f7d9b2-cbd2-4b7c-853c-4c1d09260f71', 'pedidos.view');

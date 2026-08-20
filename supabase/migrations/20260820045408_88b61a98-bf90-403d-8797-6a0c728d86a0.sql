GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, anon, service_role;
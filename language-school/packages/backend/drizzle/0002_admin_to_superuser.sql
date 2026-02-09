-- Migrate role 'admin' to 'SUPERUSER'
UPDATE "user" SET role = 'SUPERUSER' WHERE role = 'admin';

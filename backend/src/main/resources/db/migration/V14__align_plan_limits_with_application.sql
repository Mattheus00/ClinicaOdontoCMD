-- The application models plan limits as Java Integer values. Keep the
-- PostgreSQL column type aligned so Hibernate schema validation is portable.
ALTER TABLE plans
    ALTER COLUMN max_professionals TYPE INTEGER;

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Digits-only helper for phone search (immutable for index use when possible)
CREATE OR REPLACE FUNCTION dentic_digits(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(coalesce(value, ''), '\D', '', 'g');
$$;

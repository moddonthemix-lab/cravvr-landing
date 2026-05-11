-- Export every user from Supabase Auth + their app-level data, ready for
-- import into Clerk. Run as service_role (Supabase Dashboard → SQL Editor)
-- and download the result as JSON via the export button.
--
-- Each row produces ONE Clerk user. The fields are named to match Clerk's
-- POST /v1/users payload as closely as possible — the import script
-- (scripts/clerk-import.mjs) re-shapes them only minimally.

SELECT
  u.id::text                              AS supabase_uuid,         -- becomes Clerk external_id
  u.email                                 AS email,
  u.encrypted_password                    AS password_digest,        -- bcrypt hash
  u.email_confirmed_at IS NOT NULL        AS email_verified,
  u.created_at                            AS created_at,
  u.raw_user_meta_data                    AS metadata,
  COALESCE(p.role, 'customer')            AS role,
  COALESCE(p.name, split_part(u.email,'@',1)) AS name,
  c.phone                                 AS phone,
  c.points                                AS points,
  c.avatar_url                            AS avatar_url,
  o.subscription_type                     AS subscription_type,
  a.permissions                           AS admin_permissions
FROM auth.users u
LEFT JOIN public.profiles  p ON p.id = u.id
LEFT JOIN public.customers c ON c.id = u.id
LEFT JOIN public.owners    o ON o.id = u.id
LEFT JOIN public.admins    a ON a.id = u.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at;

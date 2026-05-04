-- Drop the legacy SendGrid auth trigger from migration 012.
--
-- 012 created an on-INSERT trigger on auth.users that called the
-- send-confirmation-email edge function (which used SendGrid directly).
-- We've now consolidated all email through the resend-email function,
-- which is wired into Supabase's standard Auth Hook — so this custom
-- trigger is redundant and would cause duplicate emails.
--
-- Safe to run even if 012 was never applied (uses IF EXISTS).

DROP TRIGGER IF EXISTS on_auth_user_created_send_email ON auth.users;
DROP FUNCTION IF EXISTS send_confirmation_email() CASCADE;

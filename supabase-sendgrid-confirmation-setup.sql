-- ============================================
-- SENDGRID DYNAMIC TEMPLATE EMAIL CONFIRMATION
-- ============================================
-- This sets up automatic email confirmation using SendGrid's Dynamic Templates
-- Run this in Supabase SQL Editor after deploying the Edge Function
-- ============================================

-- Create a function to send confirmation email via Edge Function
CREATE OR REPLACE FUNCTION send_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  confirmation_token TEXT;
  confirmation_url TEXT;
  edge_function_url TEXT;
  response_status INTEGER;
BEGIN
  -- Generate confirmation token
  -- Supabase automatically generates tokens, but we need to construct the URL
  -- The token_hash is stored in auth.users, but we'll use the confirmation URL pattern

  -- Construct the confirmation URL
  -- Format: https://cravvr.com/auth/confirm?token_hash={token}&type=email
  confirmation_url := current_setting('app.settings.site_url', true) ||
    '/auth/confirm?token_hash=' || encode(gen_random_bytes(32), 'hex') ||
    '&type=email&redirect_to=' || current_setting('app.settings.site_url', true);

  -- Edge Function URL (replace with your actual project URL)
  edge_function_url := current_setting('app.settings.edge_function_url', true) ||
    '/send-confirmation-email';

  -- Call the Edge Function to send email via SendGrid
  -- Note: This requires pg_net extension
  PERFORM
    net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'confirmationUrl', confirmation_url
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to send confirmation email on signup
DROP TRIGGER IF EXISTS on_auth_user_created_send_email ON auth.users;
CREATE TRIGGER on_auth_user_created_send_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.confirmation_token IS NOT NULL)
  EXECUTE FUNCTION send_confirmation_email();

-- ============================================
-- CONFIGURATION NOTES:
-- ============================================
-- 1. You need to set these Supabase settings:
--    - app.settings.site_url = 'https://cravvr.com'
--    - app.settings.edge_function_url = 'https://YOUR_PROJECT_ID.supabase.co/functions/v1'
--    - app.settings.service_role_key = 'your-service-role-key'
--
-- 2. Enable pg_net extension:
--    CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- 3. Set Edge Function environment variables in Supabase:
--    - SENDGRID_API_KEY = your SendGrid API key
--    - SENDGRID_CONFIRMATION_TEMPLATE_ID = your template ID (d-xxxxx)
--    - SITE_URL = https://cravvr.com

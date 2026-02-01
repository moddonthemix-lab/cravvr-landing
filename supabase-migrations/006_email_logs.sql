-- Email Logs Table (Optional - for tracking sent emails)
-- This table can help you debug email issues and track delivery

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'password_reset', 'welcome', 'order_confirmation', etc.
  template_id TEXT, -- SendGrid template ID used
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
  error_message TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- Optional: link to order
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: link to user
  metadata JSONB -- Store any additional email data
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_type ON email_logs(template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);

-- RLS Policies for email logs (admin only)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view all email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert email logs
CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Function to log emails (call this from your Edge Function)
CREATE OR REPLACE FUNCTION log_email(
  p_recipient_email TEXT,
  p_template_type TEXT,
  p_template_id TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'sent',
  p_error_message TEXT DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO email_logs (
    recipient_email,
    template_type,
    template_id,
    status,
    error_message,
    order_id,
    user_id,
    metadata
  )
  VALUES (
    p_recipient_email,
    p_template_type,
    p_template_id,
    p_status,
    p_error_message,
    p_order_id,
    p_user_id,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_email TO authenticated, anon;

-- Example usage:
-- SELECT log_email(
--   'user@example.com',
--   'password_reset',
--   'd-abc123',
--   'sent',
--   NULL,
--   NULL,
--   auth.uid(),
--   '{"reset_link": "https://example.com/reset"}'::jsonb
-- );

COMMENT ON TABLE email_logs IS 'Tracks all emails sent through the system for debugging and analytics';
COMMENT ON FUNCTION log_email IS 'Logs an email send event. Call this from Edge Functions after sending emails.';

/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Layout } from './_layout.tsx';
import { Heading, P, CTA, Muted } from './_components.tsx';

export interface PasswordResetProps {
  name?: string;
  resetLink: string;
}

export const subject = (_p: PasswordResetProps) => 'Reset your Cravvr password';

export default function PasswordReset({ name, resetLink }: PasswordResetProps) {
  return (
    <Layout preview="Reset your Cravvr password">
      <Heading>Reset your password</Heading>
      <P>
        Hi {name || 'there'} — we got a request to reset the password on your Cravvr account.
        Click below to set a new one. The link expires in 1 hour.
      </P>
      <CTA href={resetLink}>Reset password</CTA>
      <Muted>
        Didn't request this? You can ignore this email — your password won't change.
      </Muted>
    </Layout>
  );
}

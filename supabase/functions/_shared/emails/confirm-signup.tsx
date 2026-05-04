/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Layout } from './_layout.tsx';
import { Heading, P, CTA, Muted } from './_components.tsx';

export interface ConfirmSignupProps {
  name?: string;
  confirmLink: string;
}

export const subject = (_p: ConfirmSignupProps) => 'Confirm your Cravvr email';

export default function ConfirmSignup({ name, confirmLink }: ConfirmSignupProps) {
  return (
    <Layout preview="Confirm your email to start ordering">
      <Heading>Confirm your email</Heading>
      <P>
        Hey {name || 'there'} — one more click to finish setting up your Cravvr account.
      </P>
      <CTA href={confirmLink}>Confirm email</CTA>
      <Muted>If you didn't sign up for Cravvr, you can ignore this email.</Muted>
    </Layout>
  );
}

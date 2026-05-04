/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Layout } from './_layout.tsx';
import { Heading, P, CTA, Muted } from './_components.tsx';

export interface MagicLinkProps {
  name?: string;
  magicLink: string;
}

export const subject = (_p: MagicLinkProps) => 'Your Cravvr sign-in link';

export default function MagicLink({ name, magicLink }: MagicLinkProps) {
  return (
    <Layout preview="Your Cravvr sign-in link">
      <Heading>Sign in to Cravvr</Heading>
      <P>Hey {name || 'there'} — click below to sign in. The link expires in 1 hour.</P>
      <CTA href={magicLink}>Sign in</CTA>
      <Muted>If you didn't request this, you can safely ignore this email.</Muted>
    </Layout>
  );
}

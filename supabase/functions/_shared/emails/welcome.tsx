/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Layout, SITE_URL } from './_layout.tsx';
import { Heading, P, CTA } from './_components.tsx';

export interface WelcomeProps {
  name?: string;
  appLink?: string;
  helpLink?: string;
}

export const subject = (_p: WelcomeProps) => 'Welcome to Cravvr 🌮';

export default function Welcome({ name, appLink, helpLink }: WelcomeProps) {
  return (
    <Layout preview="Welcome to Cravvr — find food trucks near you">
      <Heading>Hey {name || 'there'} — welcome to Cravvr</Heading>
      <P>
        You're in. Cravvr is the easiest way to find food trucks near you, see what's on the
        menu, and order ahead so your food's ready when you walk up.
      </P>
      <CTA href={appLink || SITE_URL}>Find a truck near you</CTA>
      <P>
        Need help getting started?{' '}
        <a href={helpLink || `${SITE_URL}/help`} className="text-[#e11d48] underline">
          We've got you
        </a>
        .
      </P>
    </Layout>
  );
}

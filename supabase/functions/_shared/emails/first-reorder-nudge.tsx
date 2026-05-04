/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Layout } from './_layout.tsx';
import { Heading, P, CTA } from './_components.tsx';

export interface FirstReorderNudgeProps {
  name?: string;
  return_link: string;
  unsubscribe_link?: string;
}

export const subject = (_p: FirstReorderNudgeProps) =>
  'How was your first Cravvr order?';

export default function FirstReorderNudge({
  name,
  return_link,
  unsubscribe_link,
}: FirstReorderNudgeProps) {
  return (
    <Layout
      preview="How was your first Cravvr order? Find what's near you today"
      unsubscribeLink={unsubscribe_link}
    >
      <Heading>How was it?</Heading>
      <P>
        Hey {name || 'there'} — hope your first order hit. Trucks rotate every day, so the
        scene near you probably looks completely different right now.
      </P>
      <CTA href={return_link}>See what's near you today</CTA>
      <P>And — what did you eat? Reply and tell us; we read everything.</P>
    </Layout>
  );
}

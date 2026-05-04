/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Layout } from './_layout.tsx';
import { Heading, P, CTA, Muted } from './_components.tsx';

export interface WinBackProps {
  name?: string;
  last_order_at?: string;
  return_link: string;
  unsubscribe_link?: string;
}

export const subject = (_p: WinBackProps) => 'We miss you 🌮';

const formatLast = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function WinBack({
  name,
  last_order_at,
  return_link,
  unsubscribe_link,
}: WinBackProps) {
  const lastDate = formatLast(last_order_at);
  return (
    <Layout
      preview="We miss you — here's what's new on Cravvr"
      unsubscribeLink={unsubscribe_link}
    >
      <Heading>We miss you</Heading>
      <P>
        Hey {name || 'there'} — it's been a minute
        {lastDate ? <> (since {lastDate})</> : null}. Your favorite trucks have been busy
        and there's a bunch of new ones nearby.
      </P>
      <CTA href={return_link}>See what's new</CTA>
      <Muted>Come back soon — your usual is probably still on the menu.</Muted>
    </Layout>
  );
}

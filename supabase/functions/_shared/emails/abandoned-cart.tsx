/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Layout } from './_layout.tsx';
import { Heading, P, CTA, Muted } from './_components.tsx';

export interface AbandonedCartProps {
  name?: string;
  item_name?: string;
  truck_name?: string;
  return_link: string;
  unsubscribe_link?: string;
}

export const subject = (p: AbandonedCartProps) =>
  p.item_name ? `Still hungry? Your ${p.item_name} is waiting` : 'Your Cravvr cart is waiting';

export default function AbandonedCart({
  name,
  item_name,
  truck_name,
  return_link,
  unsubscribe_link,
}: AbandonedCartProps) {
  return (
    <Layout
      preview={`Your ${item_name || 'order'} from ${truck_name || 'Cravvr'} is still in your cart`}
      unsubscribeLink={unsubscribe_link}
    >
      <Heading>Still hungry?</Heading>
      <P>
        Hey {name || 'there'} — looks like you got distracted. We saved your cart
        {item_name && truck_name ? (
          <> with that <strong>{item_name}</strong> from <strong>{truck_name}</strong></>
        ) : item_name ? (
          <> with your <strong>{item_name}</strong></>
        ) : truck_name ? (
          <> from <strong>{truck_name}</strong></>
        ) : null}
        .
      </P>
      <CTA href={return_link}>Pick up where you left off</CTA>
      <Muted>Your cart is held for the next 24 hours.</Muted>
    </Layout>
  );
}

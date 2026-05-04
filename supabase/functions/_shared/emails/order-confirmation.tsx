/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Row, Column } from 'https://esm.sh/@react-email/components@0.0.25?deps=react@18.3.1';
import { Layout } from './_layout.tsx';
import { Heading, P, CTA, Muted } from './_components.tsx';

export interface OrderConfirmationProps {
  customerName?: string;
  truckName: string;
  orderNumber: string | number;
  orderTime?: string;
  estimatedTime?: string;
  items: Array<{ quantity: number; name: string; price: string | number }>;
  total: string | number;
  trackOrderLink: string;
}

export const subject = (p: OrderConfirmationProps) =>
  `Order #${p.orderNumber} confirmed — ${p.truckName}`;

export default function OrderConfirmation({
  customerName,
  truckName,
  orderNumber,
  orderTime,
  estimatedTime,
  items,
  total,
  trackOrderLink,
}: OrderConfirmationProps) {
  return (
    <Layout preview={`Order #${orderNumber} from ${truckName} is confirmed`}>
      <Heading>Order confirmed</Heading>
      <P>
        Thanks {customerName || 'there'}! Your order from{' '}
        <strong>{truckName}</strong> is in. We'll let you know when it's ready.
      </P>
      {estimatedTime ? (
        <P>
          <strong>Ready around:</strong> {estimatedTime}
        </P>
      ) : null}

      <div className="bg-[#f9fafb] rounded-lg px-4 py-3 my-4">
        <Muted>Order #{orderNumber}</Muted>
        {orderTime ? <Muted>Placed {orderTime}</Muted> : null}
        <div className="border-t border-[#e5e7eb] my-3" />
        {items.map((item, i) => (
          <Row key={i} className="my-1">
            <Column className="text-[14px] text-[#374151]">
              {item.quantity}× {item.name}
            </Column>
            <Column align="right" className="text-[14px] text-[#374151]">
              ${Number(item.price).toFixed(2)}
            </Column>
          </Row>
        ))}
        <div className="border-t border-[#e5e7eb] my-3" />
        <Row>
          <Column className="text-[15px] font-semibold text-[#111827]">Total</Column>
          <Column align="right" className="text-[15px] font-semibold text-[#111827]">
            ${Number(total).toFixed(2)}
          </Column>
        </Row>
      </div>

      <CTA href={trackOrderLink}>Track your order</CTA>
    </Layout>
  );
}

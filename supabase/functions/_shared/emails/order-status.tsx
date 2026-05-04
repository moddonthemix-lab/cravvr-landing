/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Layout } from './_layout.tsx';
import { Heading, P, CTA, Muted } from './_components.tsx';

export interface OrderStatusProps {
  customerName?: string;
  statusTitle: string;
  statusMessage: string;
  status: string;
  orderNumber: string | number;
  truckName: string;
  estimatedTime?: string | null;
  estimatedTimeLabel?: string;
  trackOrderLink: string;
}

export const subject = (p: OrderStatusProps) =>
  `${p.statusTitle} — Order #${p.orderNumber}`;

export default function OrderStatus({
  customerName,
  statusTitle,
  statusMessage,
  status,
  orderNumber,
  truckName,
  estimatedTime,
  estimatedTimeLabel,
  trackOrderLink,
}: OrderStatusProps) {
  return (
    <Layout preview={statusTitle}>
      <Heading>{statusTitle}</Heading>
      <P>Hi {customerName || 'there'} — {statusMessage}</P>

      <div className="bg-[#f9fafb] rounded-lg px-4 py-3 my-4">
        <Muted>Order #{orderNumber} · {truckName}</Muted>
        <P>
          <strong>Status:</strong> {status}
        </P>
        {estimatedTime ? (
          <Muted>
            {estimatedTimeLabel || 'Estimated time'}: {estimatedTime}
          </Muted>
        ) : null}
      </div>

      <CTA href={trackOrderLink}>View order</CTA>
    </Layout>
  );
}

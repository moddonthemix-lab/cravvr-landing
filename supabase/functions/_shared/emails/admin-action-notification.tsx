/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Layout, SITE_URL } from './_layout.tsx';
import { Heading, P, CTA } from './_components.tsx';

export interface AdminActionNotificationProps {
  ownerName?: string;
  truckName: string;
  action: 'suspended' | 'deleted' | 'restored' | 'transferred' | 'received';
  reason?: string | null;
  dashboardLink?: string;
}

const COPY: Record<string, { title: string; body: (truckName: string) => React.ReactNode }> = {
  suspended: {
    title: 'Your truck was suspended',
    body: (n) => <>An administrator suspended <strong>{n}</strong>. Customers can't see it right now. Reply to this email to appeal or get more context.</>,
  },
  deleted: {
    title: 'Your truck was removed',
    body: (n) => <>An administrator removed <strong>{n}</strong>. The truck is hidden from customers and will be permanently deleted in 30 days unless restored. Reply to this email to dispute.</>,
  },
  restored: {
    title: 'Your truck is back',
    body: (n) => <><strong>{n}</strong> is visible to customers again. Open your dashboard to confirm everything looks right.</>,
  },
  transferred: {
    title: 'Truck ownership transferred',
    body: (n) => <>Your ownership of <strong>{n}</strong> was transferred to another account by an administrator. If you didn't expect this, reply to this email.</>,
  },
  received: {
    title: 'You received a truck',
    body: (n) => <><strong>{n}</strong> was assigned to your account by an administrator. It's ready for you to manage.</>,
  },
};

export const subject = (p: AdminActionNotificationProps) => {
  switch (p.action) {
    case 'suspended':   return `Action needed: ${p.truckName} suspended`;
    case 'deleted':     return `Action needed: ${p.truckName} removed`;
    case 'restored':    return `${p.truckName} is live again`;
    case 'transferred': return `${p.truckName} was transferred`;
    case 'received':    return `You received ${p.truckName} on Cravvr`;
    default:            return `Update on ${p.truckName}`;
  }
};

export default function AdminActionNotification({
  ownerName,
  truckName,
  action,
  reason,
  dashboardLink,
}: AdminActionNotificationProps) {
  const c = COPY[action] || COPY.suspended;
  return (
    <Layout preview={c.title}>
      <Heading>{c.title}</Heading>
      <P>Hey {ownerName || 'there'},</P>
      <P>{c.body(truckName)}</P>
      {reason && (
        <P>
          <strong>Reason given:</strong> <em>"{reason}"</em>
        </P>
      )}
      <CTA href={dashboardLink || `${SITE_URL}/owner`}>Open your dashboard</CTA>
      <P>If you have questions, just reply to this email.</P>
    </Layout>
  );
}

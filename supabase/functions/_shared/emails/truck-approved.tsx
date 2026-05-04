/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import { Layout, SITE_URL } from './_layout.tsx';
import { Heading, P, CTA } from './_components.tsx';

export interface TruckApprovedProps {
  ownerName?: string;
  truckName: string;
  dashboardLink?: string;
  ownerGuideLink?: string;
}

export const subject = (p: TruckApprovedProps) =>
  `🎉 ${p.truckName} is live on Cravvr`;

export default function TruckApproved({
  ownerName,
  truckName,
  dashboardLink,
  ownerGuideLink,
}: TruckApprovedProps) {
  return (
    <Layout preview={`${truckName} is approved and live on Cravvr`}>
      <Heading>You're live 🎉</Heading>
      <P>
        Hey {ownerName || 'there'} — <strong>{truckName}</strong> just got approved on Cravvr.
        Customers can find you, browse your menu, and order ahead starting now.
      </P>
      <CTA href={dashboardLink || `${SITE_URL}/owner`}>Open your dashboard</CTA>
      <P>
        New to Cravvr?{' '}
        <a href={ownerGuideLink || `${SITE_URL}/owner-guide`} className="text-[#e11d48] underline">
          Read the owner playbook
        </a>{' '}
        — five minutes that'll save you a hundred.
      </P>
    </Layout>
  );
}

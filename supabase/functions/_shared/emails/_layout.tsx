/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.25?deps=react@18.3.1';

export const SITE_URL =
  (typeof Deno !== 'undefined' && Deno.env.get('SITE_URL')) || 'https://cravvr.com';

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
  unsubscribeLink?: string;
}

export const Layout = ({ preview, children, unsubscribeLink }: LayoutProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Tailwind>
      <Body className="bg-[#f6f6f6] font-sans m-0 p-0">
        <Container className="bg-white max-w-[560px] my-10 mx-auto rounded-xl overflow-hidden border border-[#eaeaea]">
          <Section className="px-8 pt-8 pb-2">
            <Img
              src={`${SITE_URL}/logo/icon-192.png`}
              alt="Cravvr"
              width="48"
              height="48"
              className="block"
            />
          </Section>
          <Section className="px-8 pb-8">{children}</Section>
          <Hr className="border-[#eaeaea] my-0" />
          <Section className="px-8 py-5">
            <Text className="m-0 text-xs text-[#9ca3af] leading-5">
              You're receiving this because you have a Cravvr account.
              {unsubscribeLink ? (
                <>
                  {' '}
                  <a
                    href={unsubscribeLink}
                    className="text-[#9ca3af] underline"
                  >
                    Unsubscribe from marketing emails
                  </a>
                  .
                </>
              ) : null}
            </Text>
            <Text className="m-0 mt-2 text-xs text-[#9ca3af]">
              Cravvr · find &amp; order from food trucks near you
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default Layout;

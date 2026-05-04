/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1';
import {
  Button as ReButton,
  Heading as ReHeading,
  Text as ReText,
} from 'https://esm.sh/@react-email/components@0.0.25?deps=react@18.3.1';

export const Heading = ({ children }: { children: React.ReactNode }) => (
  <ReHeading className="text-[#111827] text-2xl font-bold m-0 mt-2 mb-4 leading-tight">
    {children}
  </ReHeading>
);

export const P = ({ children }: { children: React.ReactNode }) => (
  <ReText className="text-[#374151] text-[15px] leading-6 m-0 mb-4">{children}</ReText>
);

export const Muted = ({ children }: { children: React.ReactNode }) => (
  <ReText className="text-[#6b7280] text-[14px] leading-5 m-0 mb-2">{children}</ReText>
);

export const CTA = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <ReButton
    href={href}
    className="bg-[#e11d48] text-white text-[15px] font-semibold no-underline rounded-lg px-5 py-3 inline-block my-2"
  >
    {children}
  </ReButton>
);

import React, { useState } from 'react';
import { Icons } from '../components/common/Icons';
import { joinWaitlist } from '../services/waitlist';
import { useInView } from '../hooks/useInView';
import MarketingHeader from '../components/landing/MarketingHeader';
import MarketingFooter from '../components/landing/MarketingFooter';
import BrowserMockup from '../components/landing/BrowserMockup';
import MarketingFAQ from '../components/landing/MarketingFAQ';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Icons.truck,
    title: 'Multi-Truck Fleet Management',
    description: 'Manage every truck in your fleet from a single command center. Roles, permissions, and unified reporting across locations.',
  },
  {
    icon: Icons.shield,
    title: 'Dedicated Onboarding Specialist',
    description: 'A real human walks you through setup, menu migration, POS integration, and team training. White-glove from day one.',
  },
  {
    icon: Icons.bolt,
    title: 'Custom POS & Backend Integrations',
    description: 'Stripe, Square, Clover, plus accounting (QuickBooks, Xero), inventory, loyalty, and CRM. We build what you need.',
  },
  {
    icon: Icons.chart,
    title: 'Advanced Analytics & Attribution',
    description: 'Cohort LTV, channel attribution, custom dashboards, scheduled reports to your inbox. Bring it into your BI stack via API.',
  },
  {
    icon: Icons.compass,
    title: 'Custom Branded Experience',
    description: 'Your colors, logo, custom subdomain (orders.yourbrand.com), and a customer-facing app skin that reads as you, not us.',
  },
  {
    icon: Icons.megaphone,
    title: 'Co-Marketing & Account Management',
    description: 'A dedicated account manager, quarterly business reviews, and priority placement in Cravvr discovery for your fleet.',
  },
];

const faqs = [
  { question: 'How is Enterprise different from Cravvr Go?', answer: "Cravvr Go is self-serve and works great for one or two trucks. Enterprise is for fleets of 5+ trucks, franchises, and brands that need custom integrations, dedicated support, white-glove onboarding, branded experiences, and SLAs. You also get an account manager and quarterly business reviews." },
  { question: 'How is pricing structured?', answer: "Enterprise is custom-priced based on fleet size, integration scope, and support tier. Most fleets land between $499/mo and $2,500/mo plus a one-time setup. We'll quote you on the call — no surprises, no per-transaction fees on top." },
  { question: 'How long does onboarding take?', answer: "Standard fleet onboarding is 2–4 weeks: kickoff call, menu/data migration, POS integration testing, branded portal setup, team training, and go-live. Larger or more integrated rollouts are scoped during discovery." },
  { question: 'Do you offer SLAs and uptime guarantees?', answer: "Yes. Enterprise comes with a 99.9% uptime SLA, 24/7 incident response, and a dedicated Slack/Teams channel with our engineering team for high-priority issues." },
  { question: 'Can we keep our existing payment processors?', answer: "Absolutely. Cravvr Enterprise supports Stripe, Square, and Clover at the truck level — funds settle directly to your accounts. Cravvr never takes a cut of your sales; you pay us a flat platform subscription." },
  { question: 'Do you sign DPAs and have SOC 2?', answer: "Yes — we sign DPAs, provide our security questionnaire, and our infrastructure runs on SOC 2 Type II compliant providers. Full security details are shared during procurement." },
];

const stats = [
  { value: '5+', label: 'Trucks per fleet', icon: Icons.truck, tone: 'info' },
  { value: '99.9%', label: 'Uptime SLA', icon: Icons.shield, tone: 'positive' },
  { value: '2-4 wk', label: 'Onboarding', icon: Icons.bolt, tone: 'warning' },
  { value: '0%', label: 'We take of sales', icon: Icons.check, tone: 'positive' },
];

const TONE_CHIP = {
  positive: 'bg-positive/10 text-positive',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

const Eyebrow = ({ withDot, children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
    {withDot && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
    {children}
  </span>
);

const SectionHeader = ({ eyebrow, eyebrowDot, title, gradientText, subtitle, isInView }) => (
  <div
    className={cn(
      'mx-auto max-w-2xl text-center space-y-4 transition-all duration-700',
      isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    )}
  >
    <Eyebrow withDot={eyebrowDot}>{eyebrow}</Eyebrow>
    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
      {title}{' '}
      {gradientText && (
        <span className="bg-gradient-to-r from-primary to-rose-700 bg-clip-text text-transparent">
          {gradientText}
        </span>
      )}
    </h2>
    {subtitle && (
      <p className="text-base text-muted-foreground leading-relaxed">{subtitle}</p>
    )}
  </div>
);

const FeatureCard = ({ feature, delay }) => {
  const [ref, isInView] = useInView();
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        'group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30',
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        'duration-500 ease-out'
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <span className="h-6 w-6">{feature.icon}</span>
      </span>
      <h3 className="font-bold text-lg">{feature.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
    </div>
  );
};

const EnterprisePage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [heroRef, heroInView] = useInView();
  const [featuresRef, featuresInView] = useInView();
  const [pricingRef, pricingInView] = useInView();
  const [ctaRef, ctaInView] = useInView();
  const [faqRef, faqInView] = useInView();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await joinWaitlist({
        name, email,
        type: 'cravvr_enterprise',
        metadata: { company: companyName, fleet_size: fleetSize },
      });

      if (!result.ok) {
        if (result.errorCode === 'duplicate') {
          setError('This email is already on our list — we\'ll be in touch soon.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setSubmitted(true);
        setName(''); setEmail(''); setCompanyName(''); setFleetSize('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <MarketingHeader
        navLinks={[
          { href: '#features', label: 'Capabilities' },
          { href: '#pricing', label: 'Pricing' },
          { href: '#faq', label: 'FAQ' },
          { to: '/go', label: 'Cravvr Go' },
        ]}
        ctaLabel="Talk to sales"
        ctaHref="#contact"
      />

      <main id="main">
        {/* Hero */}
        <section ref={heroRef} className="relative overflow-hidden px-5 py-16 sm:py-24">
          <div
            aria-hidden
            className="absolute inset-x-0 -top-40 -z-10 mx-auto h-[600px] max-w-7xl bg-gradient-to-b from-primary/10 via-rose-100/40 to-transparent blur-3xl"
          />
          <div
            className={cn(
              'mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] transition-all duration-700',
              heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            <div className="space-y-6">
              <Eyebrow withDot>Cravvr Enterprise</Eyebrow>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Operate your fleet like a{' '}
                <span className="bg-gradient-to-r from-primary to-rose-700 bg-clip-text text-transparent">
                  national brand
                </span>
                .
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                For multi-truck operators, franchises, and food-hall brands who need custom integrations, branded experiences, and a real partner — not just software.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <a href="#contact">
                    Book a demo
                    <span className="h-4 w-4">{Icons.arrowRight}</span>
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#features">See what's included</a>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-4 w-4 text-info">{Icons.shield}</span>
                  99.9% SLA
                </span>
                <span aria-hidden>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-4 w-4 text-warning">{Icons.bolt}</span>
                  Custom integrations
                </span>
                <span aria-hidden>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-4 w-4 text-warning">{Icons.star}</span>
                  Account manager
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <BrowserMockup
                url="fleet.yourbrand.com"
                image="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
                alt="Enterprise fleet dashboard preview"
                navItems={['Fleet', 'Reports', 'Integrations']}
                badge="12 trucks · 4 cities"
                logo="Your Brand · Fleet Console"
                tagline="Unified ops, branded as yours"
                metric="$248k"
                metricSub="this week"
                metricIcon={Icons.trendingUp}
                ctaLabel="Open dashboard"
                hint={[
                  { icon: Icons.shield, label: 'SOC 2 · DPA on file' },
                  { icon: Icons.clock, label: '24/7 support' },
                ]}
              />
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', TONE_CHIP[s.tone])}>
                    <span className="h-5 w-5">{s.icon}</span>
                  </span>
                  <div className="min-w-0">
                    <div className="text-xl font-bold tracking-tight tabular-nums truncate">{s.value}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" ref={featuresRef} className="px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Capabilities"
              title="Built for"
              gradientText="scale"
              subtitle="Everything in Cravvr Go, plus the integrations, support, and branding control a real operation needs."
              isInView={featuresInView}
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <FeatureCard feature={f} delay={i * 100} key={f.title} />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" ref={pricingRef} className="bg-muted/40 px-5 py-20">
          <div className="mx-auto max-w-3xl">
            <SectionHeader
              eyebrow="Pricing"
              title="Custom pricing,"
              gradientText="honest math"
              subtitle="Flat platform fee scoped to your fleet. No per-transaction take rate, no surprise overages. Most fleets land between $499 and $2,500/mo plus setup."
              isInView={pricingInView}
            />
            <Card className="mt-12 border-primary shadow-lg relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow">
                Cravvr Enterprise
              </span>
              <CardContent className="p-8 sm:p-10 space-y-6">
                <p className="text-sm text-muted-foreground">For fleets, franchises, and brands</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">from</span>
                      <span className="text-5xl font-bold tracking-tight">$499</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">+</span>
                      <span className="text-3xl font-bold tracking-tight">scoped</span>
                      <span className="text-sm text-muted-foreground">setup</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2.5 text-sm">
                  {['Everything in Cravvr Go', 'Multi-truck fleet console with roles', 'Dedicated onboarding specialist', 'Custom POS / accounting / loyalty integrations', 'Custom branded customer experience', 'Advanced analytics + scheduled reports', 'Account manager + quarterly business reviews', '99.9% uptime SLA, 24/7 incident response', 'SOC 2, DPA, security questionnaire'].map(li => (
                    <li key={li} className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <span className="h-3 w-3">{Icons.check}</span>
                      </span>
                      {li}
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className="w-full gap-2">
                  <a href="#contact">
                    Get a custom quote
                    <span className="h-4 w-4">{Icons.arrowRight}</span>
                  </a>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Annual billing available · Cancel with 30 days' notice.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" ref={faqRef} className="px-5 py-20">
          <div className="mx-auto max-w-3xl">
            <SectionHeader
              eyebrow="FAQ"
              title="Procurement,"
              gradientText="in plain English"
              isInView={faqInView}
            />
            <div className="mt-10">
              <MarketingFAQ faqs={faqs} />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" ref={ctaRef} className="bg-muted/40 px-5 py-20">
          <div className="mx-auto max-w-3xl">
            <SectionHeader
              eyebrow="Talk to sales"
              eyebrowDot
              title="Let's scope your"
              gradientText="rollout"
              subtitle="Drop your details and we'll be in touch within one business day to set up a 30-minute demo and discovery call."
              isInView={ctaInView}
            />

            <Card className="mt-10">
              <CardContent className="p-6 sm:p-8">
                {submitted ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-positive/10 text-positive">
                      <span className="h-7 w-7">{Icons.checkCircle}</span>
                    </span>
                    <h3 className="text-2xl font-bold">Got it — talk soon.</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Thanks for reaching out about Cravvr Enterprise. A team member will email you within one business day.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Submit another request
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-3" onSubmit={handleSubmit}>
                    {error && (
                      <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
                        {error}
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input type="text" id="ent-name" placeholder="Your name" required value={name}
                        onChange={(e) => setName(e.target.value)} disabled={submitting}
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60" />
                      <input type="email" id="ent-email" placeholder="Work email" required value={email}
                        onChange={(e) => setEmail(e.target.value)} disabled={submitting}
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input type="text" id="ent-company" placeholder="Company / brand" required value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)} disabled={submitting}
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60" />
                      <input type="text" id="ent-fleet" placeholder="Fleet size (e.g. 8 trucks)" required value={fleetSize}
                        onChange={(e) => setFleetSize(e.target.value)} disabled={submitting}
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60" />
                    </div>
                    <Button type="submit" size="lg" disabled={submitting} className="w-full gap-2">
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                          Submitting…
                        </>
                      ) : (
                        <>
                          Request a demo
                          <span className="h-4 w-4">{Icons.arrowRight}</span>
                        </>
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      By submitting, you agree to be contacted about Cravvr Enterprise. We'll never spam you.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <MarketingFooter
        columns={[
          {
            title: 'Cravvr Enterprise',
            links: [
              { href: '#features', label: 'Capabilities' },
              { href: '#pricing', label: 'Pricing' },
              { href: '#faq', label: 'FAQ' },
              { href: '#contact', label: 'Talk to sales' },
            ],
          },
          {
            title: 'Plans',
            links: [
              { to: '/go', label: 'Cravvr Go' },
              { to: '/enterprise', label: 'Enterprise' },
            ],
          },
          {
            title: 'Company',
            links: [
              { to: '/eat', label: 'About Cravvr' },
              { to: '/waitlist', label: 'Join Waitlist' },
              { href: '#contact', label: 'Contact' },
            ],
          },
        ]}
      />
    </div>
  );
};

export default EnterprisePage;

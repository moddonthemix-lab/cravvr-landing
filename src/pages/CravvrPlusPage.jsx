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
  { icon: Icons.star, title: 'Premium Cravvr Listing', description: 'Get featured placement, verified badge, and priority in search results to stand out from the competition.' },
  { icon: Icons.compass, title: 'Custom Website', description: 'A beautiful, mobile-optimized website for your truck with your menu, hours, photos, and direct ordering.' },
  { icon: Icons.trendingUp, title: 'SEO Optimization', description: "Your website is built to rank on Google. When hungry customers search, they'll find you first." },
  { icon: Icons.chart, title: 'Analytics Dashboard', description: 'Track website visits, menu views, and customer engagement with real-time insights.' },
  { icon: Icons.megaphone, title: 'Marketing Tools', description: 'Promote specials, events, and new menu items with built-in marketing features.' },
  { icon: Icons.shield, title: 'Priority Support', description: 'Direct access to our team for technical help, strategy advice, and growing your business.' },
];

const faqs = [
  { question: "What's included in the custom website?", answer: "Your website includes a homepage, menu page, location/schedule page, photo gallery, about section, and contact form. It's fully mobile-responsive and designed to convert visitors into customers." },
  { question: 'How does SEO optimization work?', answer: "We optimize your site with local keywords, schema markup, fast loading speeds, and mobile-first design. Your site will be submitted to Google and connected to your Google Business Profile for maximum visibility." },
  { question: 'Can I cancel anytime?', answer: "Yes! After your initial setup, you can cancel the monthly subscription anytime. Your website stays live as long as you're subscribed." },
  { question: 'How long until my website is live?', answer: 'Most websites are live within 5-7 business days after you provide your content (menu, photos, schedule). We handle all the technical setup.' },
  { question: 'Do I need technical skills?', answer: "Not at all! We build everything for you. You'll get a simple dashboard to update your menu and schedule, but we're always here to help." },
];

const stats = [
  { value: '3x', label: 'More visibility', icon: Icons.trendingUp, tone: 'positive' },
  { value: '24/7', label: 'Online presence', icon: Icons.clock, tone: 'info' },
  { value: '100%', label: 'Yours to keep', icon: Icons.star, tone: 'warning' },
  { value: '5-7', label: 'Days to launch', icon: Icons.check, tone: 'positive' },
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
    {subtitle && <p className="text-base text-muted-foreground leading-relaxed">{subtitle}</p>}
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

const CravvrPlusPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [truckName, setTruckName] = useState('');
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
        type: 'cravvr_plus',
        metadata: { truck_name: truckName },
      });

      if (!result.ok) {
        if (result.errorCode === 'duplicate') setError('This email is already on our list!');
        else setError('Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
        setName(''); setEmail(''); setTruckName('');
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
          { href: '#features', label: 'Features' },
          { href: '#pricing', label: 'Pricing' },
          { href: '#faq', label: 'FAQ' },
          { to: '/eat', label: 'For Food Lovers' },
        ]}
        ctaLabel="Get Started"
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
              <Eyebrow withDot>Premium for Food Trucks</Eyebrow>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Take Your Truck to the{' '}
                <span className="bg-gradient-to-r from-primary to-rose-700 bg-clip-text text-transparent">
                  Next Level
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Get everything in Cravvr plus a stunning custom website with SEO optimization. Be found online, attract more customers, and grow your business.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <a href="#contact">
                    Get Started Today
                    <span className="h-4 w-4">{Icons.arrowRight}</span>
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#features">See What's Included</a>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-4 w-4 text-warning">{Icons.bolt}</span>
                  $300 setup
                </span>
                <span aria-hidden>+</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-4 w-4 text-info">{Icons.calendar}</span>
                  $40/mo
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <BrowserMockup
                url="tacolocoexpress.cravvr.com"
                image="https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=800&q=80"
                alt="Food truck website preview"
                navItems={['Menu', 'Location', 'About']}
                badge="Open Now"
                logo="Taco Loco Express"
                tagline="Authentic Mexican Street Food"
                metric="4.9"
                metricSub="(127 reviews)"
                metricIcon={Icons.star}
                ctaLabel="Order Now"
                hint={[
                  { icon: Icons.mapPin, label: '0.3 mi away' },
                  { icon: Icons.clock, label: 'Closes at 9pm' },
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
              eyebrow="Everything You Need"
              title="One Platform,"
              gradientText="Endless Growth"
              subtitle="Cravvr Go combines our powerful food truck platform with a professional web presence to help you reach more customers."
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
              eyebrow="Simple Pricing"
              title="Invest in Your"
              gradientText="Success"
              subtitle="No hidden fees. No complicated contracts. Just powerful tools to grow your food truck business."
              isInView={pricingInView}
            />
            <Card className="mt-12 border-primary shadow-lg relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow">
                Cravvr Go
              </span>
              <CardContent className="p-8 sm:p-10 space-y-6">
                <p className="text-sm text-muted-foreground">Everything you need to dominate online</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight">$</span>
                      <span className="text-5xl font-bold tracking-tight">300</span>
                    </div>
                    <p className="text-sm text-muted-foreground">one-time setup</p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight">$</span>
                      <span className="text-5xl font-bold tracking-tight">40</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">then</p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-sm">
                  {['Premium Cravvr listing with verified badge', 'Custom-built responsive website', 'SEO optimization & Google submission', 'yourtruck.cravvr.com subdomain', 'Analytics dashboard', 'Menu & schedule management', 'Marketing & promotion tools', 'Priority support'].map(li => (
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
                    Get Started
                    <span className="h-4 w-4">{Icons.arrowRight}</span>
                  </a>
                </Button>
                <p className="text-center text-xs text-muted-foreground">No contracts. Cancel anytime.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" ref={faqRef} className="px-5 py-20">
          <div className="mx-auto max-w-3xl">
            <SectionHeader
              eyebrow="FAQ"
              title="Your questions,"
              gradientText="answered"
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
              eyebrow="Ready to grow?"
              eyebrowDot
              title="Let's Build Your"
              gradientText="Online Empire"
              subtitle="Join the food trucks that are getting found online, building their brand, and growing their customer base with Cravvr Go."
              isInView={ctaInView}
            />

            <Card className="mt-10">
              <CardContent className="p-6 sm:p-8">
                {submitted ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-positive/10 text-positive">
                      <span className="h-7 w-7">{Icons.checkCircle}</span>
                    </span>
                    <h3 className="text-2xl font-bold">You're on the list!</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Thanks for your interest in Cravvr Go! We'll reach out soon to get your truck set up.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Add another truck
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
                      <input type="text" placeholder="Your name" required value={name}
                        onChange={(e) => setName(e.target.value)} disabled={submitting}
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60" />
                      <input type="email" placeholder="Email address" required value={email}
                        onChange={(e) => setEmail(e.target.value)} disabled={submitting}
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60" />
                    </div>
                    <input type="text" placeholder="Food truck name" required value={truckName}
                      onChange={(e) => setTruckName(e.target.value)} disabled={submitting}
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60" />
                    <Button type="submit" size="lg" disabled={submitting} className="w-full gap-2">
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                          Submitting…
                        </>
                      ) : (
                        <>
                          Get Started with Cravvr Go
                          <span className="h-4 w-4">{Icons.arrowRight}</span>
                        </>
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      By submitting, you agree to be contacted about Cravvr Go. We'll never spam you.
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
            title: 'Cravvr Go',
            links: [
              { href: '#features', label: 'Features' },
              { href: '#pricing', label: 'Pricing' },
              { href: '#faq', label: 'FAQ' },
              { href: '#contact', label: 'Get Started' },
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
          {
            title: 'Legal',
            links: [
              { href: '#privacy', label: 'Privacy' },
              { href: '#terms', label: 'Terms' },
            ],
          },
        ]}
      />
    </div>
  );
};

export default CravvrPlusPage;

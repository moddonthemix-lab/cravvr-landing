import React, { useState } from 'react';
import { DeviceFrameset } from 'react-device-frameset';
import 'react-device-frameset/styles/marvel-devices.min.css';
import { useInView } from '../../hooks/useInView';
import { joinWaitlist } from '../../services/waitlist';
import { Icons } from '../common/Icons';
import Header from './Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const categories = [
  { label: 'Pizza', icon: '🍕' },
  { label: 'Burgers', icon: '🍔' },
  { label: 'Tacos', icon: '🌮' },
  { label: 'BBQ', icon: '🍖' },
  { label: 'Breakfast', icon: '🍳' },
];

const faqs = [
  {
    q: 'How is Cravrr different from other food apps?',
    a: 'Cravrr focuses exclusively on food trucks with 0% commission on pickup orders. We provide direct connections between trucks and their followers, not algorithms.',
  },
  {
    q: 'Do I need a POS system?',
    a: 'Not at all — but if you already use Stripe, Square, or Clover, you can connect them for free in a few minutes and start accepting online orders immediately. No setup fees, no per-transaction commission from Cravvr.',
  },
  {
    q: 'How do customers find my truck?',
    a: 'Our map-first app shows your real-time location. Followers get push notifications when you\'re nearby or open for business.',
  },
  {
    q: 'When will Cravrr launch?',
    a: 'We\'re currently in early access in select cities. Join the waitlist to be among the first to try it in your area.',
  },
];

const statItems = [
  { value: '0%', label: 'Commission on pickup', icon: Icons.dollarSign, tone: 'positive' },
  { value: '2.5K+', label: 'Trucks on waitlist', icon: Icons.truck, tone: 'info' },
  { value: '24/7', label: 'Real-time tracking', icon: Icons.mapPin, tone: 'warning' },
  { value: '$0', label: 'Setup fees ever', icon: Icons.creditCard, tone: 'positive' },
];

const features = [
  { icon: Icons.mapPin, title: 'Discover Nearby', body: 'Find food trucks by cuisine, location, or ratings—updated in real-time as trucks move.' },
  { icon: Icons.map, title: 'Live Map View', body: 'See exactly where your favorite trucks are parked right now with our interactive map.' },
  { icon: Icons.bell, title: 'Smart Alerts', body: 'Get notified instantly when trucks you follow are nearby or running specials.' },
  { icon: Icons.star, title: 'Earn Rewards', body: 'VIP passes, digital punch cards, and exclusive deals from trucks you love.' },
  { icon: Icons.chart, title: 'Route Analytics', body: 'Trucks get demand heatmaps, customer insights, and optimal location suggestions.' },
  { icon: Icons.creditCard, title: 'Easy Payments', body: 'Skip the line with mobile ordering and contactless pickup—no cash needed.' },
];

const stepsLovers = [
  { num: '1', title: 'Browse the Map', body: 'See all food trucks near you in real-time' },
  { num: '2', title: 'Follow Favorites', body: "Get notified when they're nearby or open" },
  { num: '3', title: 'Order & Pickup', body: 'Skip the line with mobile ordering' },
  { num: '4', title: 'Earn Rewards', body: 'Unlock VIP perks and exclusive deals' },
];

const stepsTrucks = [
  { num: '1', title: 'Go Live', body: 'Update your location with one tap' },
  { num: '2', title: 'Build Following', body: 'Customers follow for instant updates' },
  { num: '3', title: 'Take Orders', body: '0% commission on all pickup orders' },
  { num: '4', title: 'Grow Smarter', body: 'Use analytics to find the best spots' },
];

const valueProps = [
  { icon: Icons.dollarSign, text: '0% fees on pickup' },
  { icon: Icons.trendingUp, text: 'Demand heatmaps' },
  { icon: Icons.ticket, text: 'Digital punch cards' },
  { icon: Icons.megaphone, text: 'Direct to followers' },
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

const PhoneMockup = () => (
  <div className="relative inline-block">
    <div
      aria-hidden
      className="absolute inset-0 -z-10 rounded-[3rem] bg-primary/30 blur-3xl"
    />
    <DeviceFrameset device="iPhone X" color="black" zoom={0.75}>
      <div className="flex h-full flex-col bg-white text-xs">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="h-4 w-4 text-foreground">{Icons.menu}</span>
          <span className="font-bold text-sm">Browse</span>
          <span className="text-xs text-muted-foreground">Filter</span>
        </div>
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
          <span>🔍</span>
          <span>Search for trucks…</span>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-3">
          {categories.map((c) => {
            const isActive = c.label === 'Tacos';
            return (
              <div
                key={c.label}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium border',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-white text-muted-foreground'
                )}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-xs font-bold">Nearby trucks</span>
          <span className="text-xs text-primary font-semibold">Map →</span>
        </div>

        <div className="flex flex-col gap-2 px-3 pb-3 flex-1 overflow-y-auto">
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="relative h-20 bg-gradient-to-br from-orange-300 to-rose-400">
              <span className="absolute top-2 left-2 rounded-full bg-positive px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                LIVE
              </span>
              <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                ★ 4.8
              </span>
            </div>
            <div className="p-2.5 space-y-0.5">
              <div className="font-bold text-[12px]">Taco Loco Express</div>
              <div className="text-[10px] text-muted-foreground">Mexican • Street Food</div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>📍 0.3 mi away</span>
                <span className="text-positive font-semibold">Open now</span>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="relative h-20 bg-gradient-to-br from-amber-200 to-orange-300">
              <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                ★ 4.9
              </span>
            </div>
            <div className="p-2.5 space-y-0.5">
              <div className="font-bold text-[12px]">Seoul BBQ</div>
              <div className="text-[10px] text-muted-foreground">Korean • BBQ</div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>📍 0.5 mi away</span>
                <span className="text-positive font-semibold">Open now</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 items-center border-t border-border bg-white py-1.5 text-[9px]">
          {[
            { icon: '🏠', label: 'Home', active: true },
            { icon: '🗺️', label: 'Map' },
            { icon: '🛒', label: '', cart: true },
            { icon: '❤️', label: 'Saved' },
            { icon: '👤', label: 'Profile' },
          ].map((item, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5',
                item.active && 'text-primary'
              )}
            >
              <span className={cn('text-base', item.cart && 'h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center')}>
                {item.icon}
              </span>
              {item.label && <span>{item.label}</span>}
            </div>
          ))}
        </div>
      </div>
    </DeviceFrameset>
  </div>
);

const FAQItem = ({ faq, isOpen, onClick }) => (
  <div
    className={cn(
      'overflow-hidden rounded-xl border border-border bg-card transition-colors',
      isOpen && 'border-primary/40 shadow-sm'
    )}
  >
    <button
      onClick={onClick}
      aria-expanded={isOpen}
      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
    >
      <span className="font-semibold text-base">{faq.q}</span>
      <span
        className={cn(
          'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
          isOpen && 'rotate-180 text-primary'
        )}
      >
        {Icons.chevronDown}
      </span>
    </button>
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-300',
        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      )}
    >
      <div className="overflow-hidden">
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
      </div>
    </div>
  </div>
);

const Footer = () => (
  <footer className="border-t border-border bg-card/40">
    <div className="mx-auto max-w-6xl grid gap-10 px-5 py-12 md:grid-cols-[2fr_3fr]">
      <div className="space-y-4 max-w-sm">
        <a href="/" className="inline-block">
          <img src="/logo/cravrr-logo-transparent.png" alt="Cravrr" className="h-9 w-auto" />
        </a>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The map-first food truck platform that connects hungry eaters with amazing local trucks.
        </p>
        <div className="flex items-center gap-3">
          {[
            { href: '#twitter', label: 'Twitter', icon: Icons.twitter },
            { href: '#instagram', label: 'Instagram', icon: Icons.instagram },
            { href: '#facebook', label: 'Facebook', icon: Icons.facebook },
          ].map(s => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <span className="h-4 w-4">{s.icon}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
        <div className="space-y-2">
          <h4 className="font-bold text-foreground">Product</h4>
          <a href="/eat" className="block text-muted-foreground transition-colors hover:text-foreground">About Cravvr</a>
          <a href="#features" className="block text-muted-foreground transition-colors hover:text-foreground">Features</a>
          <a href="#pricing" className="block text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          <a href="#faq" className="block text-muted-foreground transition-colors hover:text-foreground">FAQ</a>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-foreground">Company</h4>
          <a href="#about" className="block text-muted-foreground transition-colors hover:text-foreground">About</a>
          <a href="#contact" className="block text-muted-foreground transition-colors hover:text-foreground">Contact</a>
          <a href="#careers" className="block text-muted-foreground transition-colors hover:text-foreground">Careers</a>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-foreground">Legal</h4>
          <a href="#privacy" className="block text-muted-foreground transition-colors hover:text-foreground">Privacy</a>
          <a href="#terms" className="block text-muted-foreground transition-colors hover:text-foreground">Terms</a>
        </div>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>© 2025 Cravrr. All rights reserved.</p>
        <p>Made with ❤️ for food trucks everywhere</p>
      </div>
    </div>
  </footer>
);

const SectionHeader = ({ eyebrow, eyebrowDot, title, gradientText, subtitle }) => (
  <div className="mx-auto max-w-2xl text-center space-y-4">
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
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.body}</p>
    </div>
  );
};

const LandingPage = ({ setCurrentView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waitlistType, setWaitlistType] = useState('lover');
  const [openFaq, setOpenFaq] = useState(0);
  const [heroRef, heroInView] = useInView();

  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setWaitlistSubmitting(true);
    setWaitlistError('');

    try {
      const result = await joinWaitlist({
        name: waitlistName,
        email: waitlistEmail,
        type: waitlistType,
      });

      if (!result.ok) {
        if (result.errorCode === 'duplicate') {
          setWaitlistError('This email is already on the waitlist!');
        } else {
          setWaitlistError('Something went wrong. Please try again.');
          console.error('Waitlist error:', result.rawError);
        }
      } else {
        setWaitlistSuccess(true);
        setWaitlistName('');
        setWaitlistEmail('');
      }
    } catch (err) {
      setWaitlistError('Something went wrong. Please try again.');
      console.error('Waitlist error:', err);
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setCurrentView={setCurrentView}
      />

      <main id="main">
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative overflow-hidden px-5 py-16 sm:py-24"
        >
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
              <Eyebrow withDot>Now in early access</Eyebrow>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                The food truck app that puts{' '}
                <span className="bg-gradient-to-r from-primary to-rose-700 bg-clip-text text-transparent">
                  trucks &amp; eaters
                </span>{' '}
                first.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Cravrr gives eaters a beautiful map-first experience and gives trucks the
                direct, low-fee revenue channel they deserve.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={() => setCurrentView('home')}
                  className="gap-2"
                >
                  Start Ordering
                  <span className="h-4 w-4 transition-transform group-hover:translate-x-1">
                    {Icons.arrowRight}
                  </span>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#waitlist">Join Waitlist</a>
                </Button>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2">
                  {[
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=50&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&q=80',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=50&q=80',
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=50&q=80',
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-background object-cover"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">2,500+</strong> trucks &amp; eaters on the waitlist
                </p>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
            {statItems.map((s) => (
              <Card key={s.label} className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                      TONE_CHIP[s.tone]
                    )}
                  >
                    <span className="h-5 w-5">{s.icon}</span>
                  </span>
                  <div className="min-w-0">
                    <div className="text-xl font-bold tracking-tight tabular-nums truncate">
                      {s.value}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Powerful features"
              title="Everything you need to"
              gradientText="discover & follow food trucks"
              subtitle="A map-first app that makes finding food trucks effortless for eaters, and running a business easier for trucks."
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <FeatureCard feature={f} delay={i * 100} key={f.title} />
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-muted/40 px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="How it works"
              title="Simple for"
              gradientText="everyone"
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {[
                { steps: stepsLovers, label: 'For Food Lovers', icon: Icons.heart, tone: 'primary' },
                { steps: stepsTrucks, label: 'For Food Trucks', icon: Icons.truck, tone: 'info' },
              ].map(block => (
                <div
                  key={block.label}
                  className="rounded-2xl border border-border bg-background p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        block.tone === 'primary'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-info/10 text-info'
                      )}
                    >
                      <span className="h-6 w-6">{block.icon}</span>
                    </span>
                    <h3 className="text-xl font-bold">{block.label}</h3>
                  </div>
                  <div className="space-y-5">
                    {block.steps.map(step => (
                      <div key={step.num} className="flex gap-4">
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm',
                            block.tone === 'primary'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-info text-info-foreground'
                          )}
                        >
                          {step.num}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">{step.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Fair pricing"
              title="No predatory"
              gradientText="commissions"
              subtitle="Keep more of what you earn. We believe in fair fees that help trucks thrive."
            />
            <div className="mt-12 grid gap-5 lg:grid-cols-2 max-w-4xl mx-auto">
              <Card className="relative">
                <CardContent className="p-8 space-y-4">
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    For Food Trucks
                  </span>
                  <div>
                    <div className="text-5xl font-bold tracking-tight">0%</div>
                    <p className="text-sm text-muted-foreground">Commission on pickup orders</p>
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {['No setup fees', 'Route analytics dashboard', 'Customer insights & data', 'Direct payment processing', 'Push notifications to followers'].map(li => (
                      <li key={li} className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive/10 text-positive">
                          <span className="h-3 w-3">{Icons.check}</span>
                        </span>
                        {li}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <a href="#waitlist">Get Started Free</a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative border-primary shadow-lg">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow">
                  Most Popular
                </span>
                <CardContent className="p-8 space-y-4">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                    For Eaters
                  </span>
                  <div>
                    <div className="text-5xl font-bold tracking-tight">Free</div>
                    <p className="text-sm text-muted-foreground">Beautiful map-first experience</p>
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {['Find trucks near you', 'Follow your favorites', 'Exclusive deals & offers', 'Easy mobile ordering', 'Loyalty rewards'].map(li => (
                      <li key={li} className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <span className="h-3 w-3">{Icons.check}</span>
                        </span>
                        {li}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <a href="#waitlist">Join Waitlist</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="bg-muted/40 px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Built for loyalty"
              title="Tools to build lasting"
              gradientText="relationships"
            />
            <div className="mt-10 grid gap-3 grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
              {valueProps.map(v => (
                <div
                  key={v.text}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-4 py-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <span className="h-4 w-4">{v.icon}</span>
                  </span>
                  <span className="text-sm font-semibold">{v.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Icons.ticket, title: 'VIP Passes', body: 'Offer monthly subscriptions for your biggest fans with exclusive perks and early access.' },
                { icon: Icons.target, title: 'Punch Cards', body: 'Digital loyalty cards that customers actually use—no more lost paper cards.' },
                { icon: Icons.gift, title: 'Exclusive Deals', body: 'Send special offers directly to your followers, not buried in an algorithm.' },
              ].map(c => (
                <Card key={c.title} className="overflow-hidden">
                  <CardContent className="p-6 space-y-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-rose-700 text-primary-foreground">
                      <span className="h-6 w-6">{c.icon}</span>
                    </span>
                    <h3 className="text-lg font-bold">{c.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-5 py-20">
          <div className="mx-auto max-w-3xl">
            <SectionHeader
              eyebrow="FAQ"
              title="Your questions,"
              gradientText="answered"
            />
            <div className="mt-10 space-y-3">
              {faqs.map((f, i) => (
                <FAQItem
                  key={f.q}
                  faq={f}
                  isOpen={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Waitlist */}
        <section id="waitlist" className="bg-muted/40 px-5 py-20">
          <div className="mx-auto max-w-3xl">
            <SectionHeader
              eyebrow="Limited early access"
              eyebrowDot
              title="Be first in line when we"
              gradientText="launch"
              subtitle="Join 2,500+ trucks and eaters already on the waitlist. Get early access and exclusive perks."
            />

            <Card className="mt-10">
              <CardContent className="p-6 sm:p-8">
                {waitlistSuccess ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-positive/10 text-positive">
                      <span className="h-7 w-7">{Icons.checkCircle}</span>
                    </span>
                    <h3 className="text-2xl font-bold">You're on the list!</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Thanks for joining! We'll notify you when Cravrr launches in your area.
                    </p>
                    <Button variant="outline" onClick={() => setWaitlistSuccess(false)}>
                      Add another email
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {[
                        { type: 'lover', icon: '🍔', label: "I'm a Food Lover" },
                        { type: 'truck', icon: '🚚', label: 'I Run a Truck' },
                      ].map(opt => {
                        const isActive = waitlistType === opt.type;
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setWaitlistType(opt.type)}
                            className={cn(
                              'inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                              isActive
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            )}
                          >
                            <span className="text-lg">{opt.icon}</span>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <form className="space-y-3" onSubmit={handleWaitlistSubmit}>
                      {waitlistError && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                          <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
                          {waitlistError}
                        </div>
                      )}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          id="waitlist-name"
                          placeholder="Your name"
                          required
                          value={waitlistName}
                          onChange={(e) => setWaitlistName(e.target.value)}
                          disabled={waitlistSubmitting}
                          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60"
                        />
                        <input
                          type="email"
                          id="waitlist-email"
                          placeholder="Email address"
                          required
                          value={waitlistEmail}
                          onChange={(e) => setWaitlistEmail(e.target.value)}
                          disabled={waitlistSubmitting}
                          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60"
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={waitlistSubmitting}
                        className="w-full gap-2"
                      >
                        {waitlistSubmitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                            Joining…
                          </>
                        ) : (
                          <>
                            Get Early Access
                            <span className="h-4 w-4">{Icons.arrowRight}</span>
                          </>
                        )}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        No spam, ever. Unsubscribe anytime.
                      </p>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;

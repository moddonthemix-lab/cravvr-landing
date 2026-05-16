import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { setTags as clarityTags, event as clarityEvent } from '@/lib/clarity';
import { readUTMs } from '@/lib/utm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '../components/common/Icons';
import MarketingHeader from '../components/landing/MarketingHeader';
import MarketingFooter from '../components/landing/MarketingFooter';
import MarketingFAQ from '../components/landing/MarketingFAQ';
import { cn } from '@/lib/utils';
import { submitTruckLead } from '../services/truckLead';

// ─── City configuration ──────────────────────────────────────────────────────
// Update social-proof numbers here as trucks onboard. Headlines are tuned per
// city; swap in real testimonials when you have them.
// Truck counts reflect real onboarded trucks in each market. Update by
// re-querying food_trucks and bucketing by coordinates — see scripts/.
// Keep these honest: claiming a count higher than reality kills trust the
// moment an operator opens the app and sees an empty map.
const CITY_CONFIG = {
  portland: {
    slug: 'portland',
    label: 'Portland',
    region: 'Portland, OR',
    hero: {
      eyebrow: 'Founding Cohort — Portland',
      title: 'Be one of the first 25 Portland trucks on Cravvr.',
      sub: 'We just launched in Portland. Get in early, get the best map placement, and shape how Cravvr serves your city.',
    },
    stats: [
      { value: '1', label: 'Portland truck already live' },
      { value: '24', label: 'founding spots open this month' },
      { value: '$0', label: 'to join — no setup, no monthly' },
    ],
    closingCity: 'Portland trucks',
  },
  'st-pete': {
    slug: 'st-pete',
    label: 'St. Petersburg',
    region: 'St. Petersburg, FL',
    hero: {
      eyebrow: 'Founding Cohort — St. Pete',
      title: 'Be one of the first 25 St. Pete trucks on Cravvr.',
      sub: 'We just launched in St. Pete. Get in early, get the best map placement, and help shape Cravvr in your city.',
    },
    stats: [
      { value: '1', label: 'St. Pete truck already live' },
      { value: '24', label: 'founding spots open this month' },
      { value: '$0', label: 'to join — no setup, no monthly' },
    ],
    closingCity: 'St. Pete trucks',
  },
  tampa: {
    slug: 'tampa',
    label: 'Tampa',
    region: 'Tampa, FL',
    hero: {
      eyebrow: 'Founding Cohort — Tampa',
      title: 'Launch with us. First 25 Tampa trucks get founding perks.',
      sub: "Cravvr is launching in Tampa this month. Founding trucks get the best map placement, free profile setup, and shape how Cravvr works for your city.",
    },
    stats: [
      { value: '25', label: 'founding spots — Tampa launch' },
      { value: '0%', label: 'commission on pickup orders' },
      { value: '$0', label: 'to join — no setup, no monthly' },
    ],
    closingCity: 'Tampa trucks',
  },
};

const CUISINES = [
  'Mexican', 'Asian', 'BBQ', 'Burgers', 'Pizza',
  'Seafood', 'Vegan', 'Desserts', 'Coffee', 'Other',
];

const BEST_TIMES = [
  { id: 'morning', label: 'Weekday mornings' },
  { id: 'afternoon', label: 'Weekday afternoons' },
  { id: 'evening', label: 'Weekday evenings' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'anytime', label: 'Anytime' },
];

const FAQ_ITEMS = [
  {
    q: 'How much does it cost?',
    a: 'Nothing to join. 0% commission on pickup orders. We only make money when you upgrade to paid tools — and only if they pay for themselves.',
  },
  {
    q: 'How long does setup take?',
    a: 'About 10 minutes. You give us your menu, hours, and a few photos — we handle the rest. Most trucks are live within 24 hours.',
  },
  {
    q: 'Do I need any new hardware?',
    a: 'No. Cravvr runs on your phone. If you already use Square or Stripe, we integrate directly so payments land in your existing account.',
  },
  {
    q: 'What if I already have a website / Instagram?',
    a: 'Keep them. Cravvr is the place people *discover* you when they don\'t already know your truck exists. We send customers to you, not away.',
  },
  {
    q: 'When do you onboard new trucks?',
    a: 'We onboard a fixed number per city per month so we can actually drive traffic to each one. Apply now to lock your spot for this month\'s cohort.',
  },
];

const ForTrucksPage = () => {
  const { city: cityParam } = useParams();
  const city = CITY_CONFIG[cityParam];

  // Always-call hooks before the guard. Use a safe fallback slug for the
  // submission state so we don't conditionally call hooks.
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', truckName: '', phone: '', email: '',
    cuisine: '', bestTime: '', notes: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isValid = useMemo(
    () => form.name.trim().length >= 2 && form.phone.replace(/\D/g, '').length >= 10,
    [form.name, form.phone],
  );

  useEffect(() => {
    if (!city) return;
    const utms = readUTMs();
    clarityTags({
      page: 'for-trucks',
      city: city.slug,
      utm_source: utms.utm_source,
      utm_campaign: utms.utm_campaign,
      utm_content: utms.utm_content,
    });
  }, [city]);

  if (!city) {
    return <Navigate to="/for-trucks/portland" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setError('');
    setSubmitting(true);
    const res = await submitTruckLead({ ...form, city: city.slug });
    setSubmitting(false);
    if (res.ok) {
      clarityEvent('truck_lead_submit');
      setSubmitted(true);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(res.error === 'missing_required_fields'
        ? 'Please fill in your name and phone.'
        : 'Something went wrong. Please try again in a moment.');
    }
  };

  const navLinks = [
    { label: 'How it works', href: '#how' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader
        navLinks={navLinks}
        ctaLabel="Apply now"
        ctaHref="#apply"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:pt-20 sm:pb-24 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
              {city.hero.eyebrow}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {city.hero.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              {city.hero.sub}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" data-cta="hero-apply">
                <a href="#apply">Apply in 60 seconds</a>
              </Button>
              <Button asChild variant="outline" size="lg" data-cta="hero-learn">
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-6">
              {city.stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form card */}
          <div id="apply" className="lg:pl-8">
            <Card className="shadow-xl border-primary/20">
              <CardContent className="p-6 sm:p-8">
                {submitted ? (
                  <SuccessState city={city} />
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold">Apply to onboard your truck</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        We text you back within 5 minutes. No deck, no slide pitch — just a real conversation.
                      </p>
                    </div>
                    <Field label="Your name *" htmlFor="name">
                      <Input id="name" value={form.name} onChange={set('name')} autoComplete="name" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Truck name" htmlFor="truckName">
                        <Input id="truckName" value={form.truckName} onChange={set('truckName')} />
                      </Field>
                      <Field label="Cuisine" htmlFor="cuisine">
                        <select
                          id="cuisine"
                          value={form.cuisine}
                          onChange={set('cuisine')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select…</option>
                          {CUISINES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Phone *" htmlFor="phone">
                      <Input id="phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="(555) 555-5555" />
                    </Field>
                    <Field label="Email (optional)" htmlFor="email">
                      <Input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
                    </Field>
                    <Field label="Best time to reach you" htmlFor="bestTime">
                      <select
                        id="bestTime"
                        value={form.bestTime}
                        onChange={set('bestTime')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Anytime</option>
                        {BEST_TIMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </Field>
                    {error && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={!isValid || submitting}
                      data-cta="form-submit"
                    >
                      {submitting ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                          Submitting…
                        </span>
                      ) : (
                        'Apply now'
                      )}
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      By submitting you agree to be contacted about Cravvr. We don't sell or share your info.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How Cravvr works for trucks</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Three steps. Most {city.closingCity} are live within 24 hours of applying.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { n: '1', t: 'Apply', d: 'Fill out the form above. We text you back same-day to schedule a 10-min call.' },
              { n: '2', t: 'Setup', d: 'We build your truck profile, import your menu, and connect Square or Stripe — you confirm.' },
              { n: '3', t: 'Go live', d: 'Your truck appears on the map for every Cravvr user in your city. Orders start that day.' },
            ].map((step) => (
              <Card key={step.n}>
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {step.n}
                  </div>
                  <div className="text-lg font-semibold">{step.t}</div>
                  <p className="text-sm text-muted-foreground">{step.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-10">
            Questions {city.closingCity} ask
          </h2>
          <MarketingFAQ faqs={FAQ_ITEMS} />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            We're onboarding a limited number of {city.region} trucks this month.
          </h2>
          <p className="text-lg opacity-90">
            Get on the list before we cap the cohort. Free, no contracts, no surprises.
          </p>
          <Button asChild size="lg" variant="secondary" data-cta="footer-apply">
            <a href="#apply">Apply now</a>
          </Button>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-3 bg-background/95 backdrop-blur border-t border-border lg:hidden">
        <Button asChild className="w-full" size="lg" data-cta="sticky-apply">
          <a href="#apply">Apply to onboard — free</a>
        </Button>
      </div>

      <MarketingFooter />
    </div>
  );
};

const Field = ({ label, htmlFor, children }) => (
  <div className="space-y-1.5">
    <Label htmlFor={htmlFor} className="text-sm">{label}</Label>
    {children}
  </div>
);

const SuccessState = ({ city }) => (
  <div className="text-center space-y-4 py-6">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-positive/15 text-positive">
      <span className="h-7 w-7">{Icons.check}</span>
    </div>
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">You're in. We'll text you within 5 minutes.</h2>
      <p className="text-sm text-muted-foreground">
        We're personally reaching out to every {city.region} truck owner who applies. Keep your phone close.
      </p>
    </div>
    <div className="rounded-md bg-muted/50 p-4 text-left text-sm text-muted-foreground">
      <strong className="text-foreground block mb-1">What happens next:</strong>
      1. Text from us within 5 minutes<br />
      2. 10-minute call to walk through your truck<br />
      3. Live on the map within 24 hours
    </div>
  </div>
);

export default ForTrucksPage;

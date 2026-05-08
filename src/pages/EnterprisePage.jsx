import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/common/Icons';
import { supabase } from '../lib/supabase';
import { useInView } from '../hooks/useInView';
import './EnterprisePage.css';

const EnterprisePage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

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
      const { error: dbError } = await supabase
        .from('waitlist')
        .insert([{
          name,
          email,
          type: 'cravvr_enterprise',
          metadata: { company: companyName, fleet_size: fleetSize },
          status: 'pending',
        }]);

      if (dbError) {
        if (dbError.code === '23505') {
          setError('This email is already on our list — we\'ll be in touch soon.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setSubmitted(true);
        setName('');
        setEmail('');
        setCompanyName('');
        setFleetSize('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
    {
      question: 'How is Enterprise different from Cravvr Go?',
      answer: "Cravvr Go is self-serve and works great for one or two trucks. Enterprise is for fleets of 5+ trucks, franchises, and brands that need custom integrations, dedicated support, white-glove onboarding, branded experiences, and SLAs. You also get an account manager and quarterly business reviews.",
    },
    {
      question: 'How is pricing structured?',
      answer: "Enterprise is custom-priced based on fleet size, integration scope, and support tier. Most fleets land between $499/mo and $2,500/mo plus a one-time setup. We'll quote you on the call — no surprises, no per-transaction fees on top.",
    },
    {
      question: 'How long does onboarding take?',
      answer: "Standard fleet onboarding is 2–4 weeks: kickoff call, menu/data migration, POS integration testing, branded portal setup, team training, and go-live. Larger or more integrated rollouts are scoped during discovery.",
    },
    {
      question: 'Do you offer SLAs and uptime guarantees?',
      answer: "Yes. Enterprise comes with a 99.9% uptime SLA, 24/7 incident response, and a dedicated Slack/Teams channel with our engineering team for high-priority issues.",
    },
    {
      question: 'Can we keep our existing payment processors?',
      answer: "Absolutely. Cravvr Enterprise supports Stripe, Square, and Clover at the truck level — funds settle directly to your accounts. Cravvr never takes a cut of your sales; you pay us a flat platform subscription.",
    },
    {
      question: 'Do you sign DPAs and have SOC 2?',
      answer: "Yes — we sign DPAs, provide our security questionnaire, and our infrastructure runs on SOC 2 Type II compliant providers. Full security details are shared during procurement.",
    },
  ];

  return (
    <div className="page cravvr-plus-page enterprise-page">
      {/* Header */}
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src="/logo/cravvr-logo.png" alt="Cravvr" className="logo-image" />
          </Link>

          <nav className="desktop-nav">
            <a href="#features">Capabilities</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <Link to="/go">Cravvr Go</Link>
          </nav>

          <div className="header-actions">
            <a href="#contact" className="btn-primary btn-sm">Talk to sales</a>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? Icons.x : Icons.menu}
          </button>
        </div>

        <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <nav>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Capabilities</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <Link to="/go" onClick={() => setMobileMenuOpen(false)}>Cravvr Go</Link>
          </nav>
          <div className="mobile-auth-section">
            <a href="#contact" className="btn-primary full-width" onClick={() => setMobileMenuOpen(false)}>
              Talk to sales
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="hero plus-hero" ref={heroRef}>
          <div className={`hero-content ${heroInView ? 'animate-in' : ''}`}>
            <div className="hero-text">
              <span className="eyebrow">
                <span className="eyebrow-dot"></span>
                Cravvr Enterprise
              </span>
              <h1>
                Operate your fleet like a <span className="gradient-text">national brand</span>.
              </h1>
              <p className="lede">
                For multi-truck operators, franchises, and food-hall brands who need custom
                integrations, branded experiences, and a real partner — not just software.
              </p>
              <div className="hero-actions">
                <a href="#contact" className="btn-primary btn-lg">
                  Book a demo
                  <span className="btn-icon">{Icons.arrowRight}</span>
                </a>
                <a href="#features" className="btn-ghost btn-lg">
                  See what's included
                </a>
              </div>
              <div className="hero-social-proof">
                <div className="plus-badge-row">
                  <span className="plus-badge">{Icons.shield} 99.9% SLA</span>
                  <span className="plus-badge-divider">•</span>
                  <span className="plus-badge">{Icons.bolt} Custom integrations</span>
                  <span className="plus-badge-divider">•</span>
                  <span className="plus-badge">{Icons.star} Account manager</span>
                </div>
              </div>
            </div>
            <div className="hero-device">
              <div className="browser-mockup">
                <div className="browser-chrome">
                  <span className="chrome-dot"></span>
                  <span className="chrome-dot"></span>
                  <span className="chrome-dot"></span>
                  <div className="chrome-url">
                    {Icons.lock}
                    <span>fleet.yourbrand.com</span>
                  </div>
                </div>
                <div className="browser-screen">
                  <img
                    src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
                    alt="Enterprise fleet dashboard preview"
                    className="screen-image"
                  />
                  <div className="screen-overlay">
                    <div className="site-nav">
                      <span>Fleet</span>
                      <span>Reports</span>
                      <span>Integrations</span>
                    </div>
                    <div className="site-hero-content">
                      <div className="site-badge">12 trucks · 4 cities</div>
                      <div className="site-logo">Your Brand · Fleet Console</div>
                      <div className="site-tagline">Unified ops, branded as yours</div>
                      <div className="site-rating">
                        {Icons.trendingUp}
                        <span>$248k</span>
                        <span className="rating-count">this week</span>
                      </div>
                      <button className="site-cta">Open dashboard</button>
                    </div>
                    <div className="site-footer-hint">
                      <span>{Icons.shield} SOC 2 · DPA on file</span>
                      <span>{Icons.clock} 24/7 support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-stats plus-stats">
            <div className="stat">
              <div className="stat-icon">{Icons.truck}</div>
              <div className="stat-content">
                <div className="stat-value">5+</div>
                <div className="stat-label">Trucks per fleet</div>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon">{Icons.shield}</div>
              <div className="stat-content">
                <div className="stat-value">99.9%</div>
                <div className="stat-label">Uptime SLA</div>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon">{Icons.bolt}</div>
              <div className="stat-content">
                <div className="stat-value">2-4 wk</div>
                <div className="stat-label">Onboarding</div>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon">{Icons.check}</div>
              <div className="stat-content">
                <div className="stat-value">0%</div>
                <div className="stat-label">We take of sales</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section" id="features" ref={featuresRef}>
          <div className="container">
            <div className={`section-header-center ${featuresInView ? 'animate-in' : ''}`}>
              <span className="eyebrow">Capabilities</span>
              <h2>Built for <span className="gradient-text">scale</span></h2>
              <p className="section-subtitle">
                Everything in Cravvr Go, plus the integrations, support, and branding control
                a real operation needs.
              </p>
            </div>
            <div className="feature-grid">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-card ${featuresInView ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="section section-alt" id="pricing" ref={pricingRef}>
          <div className="container">
            <div className={`section-header-center ${pricingInView ? 'animate-in' : ''}`}>
              <span className="eyebrow">Pricing</span>
              <h2>Custom pricing, <span className="gradient-text">honest math</span></h2>
              <p className="section-subtitle">
                Flat platform fee scoped to your fleet. No per-transaction take rate, no
                surprise overages. Most fleets land between $499 and $2,500/mo plus setup.
              </p>
            </div>
            <div className="pricing-grid plus-pricing-grid">
              <div className={`price-card featured plus-price-card ${pricingInView ? 'animate-in' : ''}`} style={{ animationDelay: '200ms' }}>
                <div className="price-badge-featured">Cravvr Enterprise</div>
                <div className="plus-price-header">
                  <p className="plus-price-tagline">For fleets, franchises, and brands</p>
                </div>
                <div className="plus-price-display">
                  <div className="plus-price-row">
                    <div className="plus-price-amount">
                      <span className="plus-currency">from</span>
                      <span className="plus-value">$499</span>
                    </div>
                    <div className="plus-price-label">/month</div>
                  </div>
                  <div className="plus-price-divider">
                    <span>plus</span>
                  </div>
                  <div className="plus-price-row">
                    <div className="plus-price-amount">
                      <span className="plus-currency">$</span>
                      <span className="plus-value">scoped</span>
                    </div>
                    <div className="plus-price-label">setup</div>
                  </div>
                </div>
                <ul className="price-list">
                  <li><span className="check">{Icons.check}</span> Everything in Cravvr Go</li>
                  <li><span className="check">{Icons.check}</span> Multi-truck fleet console with roles</li>
                  <li><span className="check">{Icons.check}</span> Dedicated onboarding specialist</li>
                  <li><span className="check">{Icons.check}</span> Custom POS / accounting / loyalty integrations</li>
                  <li><span className="check">{Icons.check}</span> Custom branded customer experience</li>
                  <li><span className="check">{Icons.check}</span> Advanced analytics + scheduled reports</li>
                  <li><span className="check">{Icons.check}</span> Account manager + quarterly business reviews</li>
                  <li><span className="check">{Icons.check}</span> 99.9% uptime SLA, 24/7 incident response</li>
                  <li><span className="check">{Icons.check}</span> SOC 2, DPA, security questionnaire</li>
                </ul>
                <a href="#contact" className="btn-primary btn-lg full-width">
                  Get a custom quote
                  <span className="btn-icon">{Icons.arrowRight}</span>
                </a>
                <p className="plus-pricing-note">Annual billing available · Cancel with 30 days' notice.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq" ref={faqRef}>
          <div className="container">
            <div className={`section-header-center ${faqInView ? 'animate-in' : ''}`}>
              <span className="eyebrow">FAQ</span>
              <h2>Procurement, <span className="gradient-text">in plain English</span></h2>
            </div>
            <div className="faq-container">
              {faqs.map((faq, index) => (
                <div key={index} className={`faq-item ${openFaq === index ? 'open' : ''}`}>
                  <button
                    className="faq-question"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    aria-expanded={openFaq === index}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-icon">{Icons.chevronDown}</span>
                  </button>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="section section-alt" id="contact" ref={ctaRef}>
          <div className="container">
            <div className="waitlist-block plus-waitlist">
              <div className={`section-header-center ${ctaInView ? 'animate-in' : ''}`}>
                <span className="eyebrow">
                  <span className="eyebrow-dot"></span>
                  Talk to sales
                </span>
                <h2>Let's scope your <span className="gradient-text">rollout</span></h2>
                <p className="section-subtitle">
                  Drop your details and we'll be in touch within one business day to set up a 30-minute demo and discovery call.
                </p>
              </div>
              <div className="waitlist-form">
                {submitted ? (
                  <div className="waitlist-success">
                    <div className="success-icon">{Icons.checkCircle}</div>
                    <h3>Got it — talk soon.</h3>
                    <p>Thanks for reaching out about Cravvr Enterprise. A team member will email you within one business day.</p>
                    <button className="btn-ghost" onClick={() => setSubmitted(false)}>
                      Submit another request
                    </button>
                  </div>
                ) : (
                  <form className="form-fields" onSubmit={handleSubmit}>
                    {error && (
                      <div className="form-error">
                        <span className="error-icon">{Icons.alertCircle}</span>
                        {error}
                      </div>
                    )}
                    <div className="form-row">
                      <div className="form-field">
                        <input type="text" id="ent-name" placeholder=" " required value={name}
                          onChange={(e) => setName(e.target.value)} disabled={submitting} />
                        <label htmlFor="ent-name">Your Name</label>
                      </div>
                      <div className="form-field">
                        <input type="email" id="ent-email" placeholder=" " required value={email}
                          onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
                        <label htmlFor="ent-email">Work Email</label>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <input type="text" id="ent-company" placeholder=" " required value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)} disabled={submitting} />
                        <label htmlFor="ent-company">Company / Brand</label>
                      </div>
                      <div className="form-field">
                        <input type="text" id="ent-fleet" placeholder=" " required value={fleetSize}
                          onChange={(e) => setFleetSize(e.target.value)} disabled={submitting} />
                        <label htmlFor="ent-fleet">Fleet size (e.g. 8 trucks)</label>
                      </div>
                    </div>
                    <button type="submit" className="btn-primary btn-lg full-width" disabled={submitting}>
                      {submitting ? (
                        <><span className="btn-spinner">{Icons.loader}</span> Submitting...</>
                      ) : (
                        <>Request a demo<span className="btn-icon">{Icons.arrowRight}</span></>
                      )}
                    </button>
                    <p className="form-disclaimer">
                      By submitting, you agree to be contacted about Cravvr Enterprise. We'll never spam you.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <Link to="/" className="logo">
              <img src="/logo/cravrr-logo-transparent.png" alt="Cravvr" className="footer-logo-image" />
            </Link>
            <p>The map-first food truck platform that connects hungry eaters with amazing local trucks.</p>
            <div className="social-links">
              <a href="#twitter" aria-label="Twitter">{Icons.twitter}</a>
              <a href="#instagram" aria-label="Instagram">{Icons.instagram}</a>
              <a href="#facebook" aria-label="Facebook">{Icons.facebook}</a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Cravvr Enterprise</h4>
              <a href="#features">Capabilities</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
              <a href="#contact">Talk to sales</a>
            </div>
            <div className="footer-col">
              <h4>Plans</h4>
              <Link to="/go">Cravvr Go</Link>
              <Link to="/enterprise">Enterprise</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to="/eat">About Cravvr</Link>
              <Link to="/waitlist">Join Waitlist</Link>
              <a href="#contact">Contact</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Cravvr. All rights reserved.</p>
          <p className="footer-tagline">Made with love for food trucks everywhere</p>
        </div>
      </footer>
    </div>
  );
};

export default EnterprisePage;

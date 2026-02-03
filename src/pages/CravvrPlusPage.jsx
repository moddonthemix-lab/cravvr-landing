import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../components/common/Icons';
import { supabase } from '../lib/supabase';
import { useInView } from '../hooks/useInView';
import './CravvrPlusPage.css';

const CravvrPlusPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [truckName, setTruckName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Intersection observers for animations
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
          name: name,
          email: email,
          type: 'cravvr_plus',
          metadata: { truck_name: truckName },
          status: 'pending'
        }]);

      if (dbError) {
        if (dbError.code === '23505') {
          setError('This email is already on our list!');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setSubmitted(true);
        setName('');
        setEmail('');
        setTruckName('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    {
      icon: Icons.star,
      title: 'Premium Cravvr Listing',
      description: 'Get featured placement, verified badge, and priority in search results to stand out from the competition.'
    },
    {
      icon: Icons.compass,
      title: 'Custom Website',
      description: 'A beautiful, mobile-optimized website for your truck with your menu, hours, photos, and direct ordering.'
    },
    {
      icon: Icons.trendingUp,
      title: 'SEO Optimization',
      description: "Your website is built to rank on Google. When hungry customers search, they'll find you first."
    },
    {
      icon: Icons.chart,
      title: 'Analytics Dashboard',
      description: 'Track website visits, menu views, and customer engagement with real-time insights.'
    },
    {
      icon: Icons.megaphone,
      title: 'Marketing Tools',
      description: 'Promote specials, events, and new menu items with built-in marketing features.'
    },
    {
      icon: Icons.shield,
      title: 'Priority Support',
      description: 'Direct access to our team for technical help, strategy advice, and growing your business.'
    }
  ];

  const faqs = [
    {
      question: "What's included in the custom website?",
      answer: "Your website includes a homepage, menu page, location/schedule page, photo gallery, about section, and contact form. It's fully mobile-responsive and designed to convert visitors into customers."
    },
    {
      question: 'How does SEO optimization work?',
      answer: "We optimize your site with local keywords, schema markup, fast loading speeds, and mobile-first design. Your site will be submitted to Google and connected to your Google Business Profile for maximum visibility."
    },
    {
      question: 'Can I cancel anytime?',
      answer: "Yes! After your initial setup, you can cancel the monthly subscription anytime. Your website stays live as long as you're subscribed."
    },
    {
      question: 'How long until my website is live?',
      answer: 'Most websites are live within 5-7 business days after you provide your content (menu, photos, schedule). We handle all the technical setup.'
    },
    {
      question: 'Do I need technical skills?',
      answer: "Not at all! We build everything for you. You'll get a simple dashboard to update your menu and schedule, but we're always here to help."
    }
  ];

  return (
    <div className="page cravvr-plus-page">
      {/* Header - Matching main site */}
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src="/logo/cravvr-logo.png" alt="Cravvr" className="logo-image" />
          </Link>

          <nav className="desktop-nav">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <Link to="/eat">For Food Lovers</Link>
          </nav>

          <div className="header-actions">
            <a href="#contact" className="btn-primary btn-sm">Get Started</a>
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
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <Link to="/eat" onClick={() => setMobileMenuOpen(false)}>For Food Lovers</Link>
          </nav>
          <div className="mobile-auth-section">
            <a href="#contact" className="btn-primary full-width" onClick={() => setMobileMenuOpen(false)}>
              Get Started
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero Section */}
        <section className="hero plus-hero" ref={heroRef}>
          <div className={`hero-content ${heroInView ? 'animate-in' : ''}`}>
            <div className="hero-text">
              <span className="eyebrow">
                <span className="eyebrow-dot"></span>
                Premium for Food Trucks
              </span>
              <h1>
                Take Your Truck to the{' '}
                <span className="gradient-text">Next Level</span>
              </h1>
              <p className="lede">
                Get everything in Cravvr plus a stunning custom website with SEO optimization.
                Be found online, attract more customers, and grow your business.
              </p>
              <div className="hero-actions">
                <a href="#contact" className="btn-primary btn-lg">
                  Get Started Today
                  <span className="btn-icon">{Icons.arrowRight}</span>
                </a>
                <a href="#features" className="btn-ghost btn-lg">
                  See What's Included
                </a>
              </div>
              <div className="hero-social-proof">
                <div className="plus-badge-row">
                  <span className="plus-badge">{Icons.bolt} $300 setup</span>
                  <span className="plus-badge-divider">+</span>
                  <span className="plus-badge">{Icons.calendar} $40/mo</span>
                </div>
              </div>
            </div>
            <div className="hero-device">
              <div className="plus-mockup">
                <div className="mockup-glow"></div>
                <div className="mockup-browser">
                  <div className="browser-bar">
                    <div className="browser-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div className="browser-url">
                      <span className="url-lock">{Icons.lock}</span>
                      yourtruck.cravvr.com
                    </div>
                  </div>
                  <div className="browser-content">
                    <div className="mockup-hero-img">
                      <div className="mockup-hero-overlay">
                        <div className="mockup-truck-name"></div>
                        <div className="mockup-truck-tagline"></div>
                      </div>
                    </div>
                    <div className="mockup-body">
                      <div className="mockup-nav-pills">
                        <span className="active"></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <div className="mockup-section">
                        <div className="mockup-section-title"></div>
                        <div className="mockup-cards">
                          <div className="mockup-card"></div>
                          <div className="mockup-card"></div>
                          <div className="mockup-card"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mockup-phone">
                  <div className="phone-frame">
                    <div className="phone-notch"></div>
                    <div className="phone-content">
                      <div className="phone-header-bar"></div>
                      <div className="phone-hero"></div>
                      <div className="phone-menu-item"></div>
                      <div className="phone-menu-item"></div>
                      <div className="phone-cta"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-stats plus-stats">
            <div className="stat">
              <div className="stat-icon">{Icons.trendingUp}</div>
              <div className="stat-content">
                <div className="stat-value">3x</div>
                <div className="stat-label">More visibility</div>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon">{Icons.clock}</div>
              <div className="stat-content">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Online presence</div>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon">{Icons.star}</div>
              <div className="stat-content">
                <div className="stat-value">100%</div>
                <div className="stat-label">Yours to keep</div>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon">{Icons.check}</div>
              <div className="stat-content">
                <div className="stat-value">5-7</div>
                <div className="stat-label">Days to launch</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section" id="features" ref={featuresRef}>
          <div className="container">
            <div className={`section-header-center ${featuresInView ? 'animate-in' : ''}`}>
              <span className="eyebrow">Everything You Need</span>
              <h2>One Platform, <span className="gradient-text">Endless Growth</span></h2>
              <p className="section-subtitle">
                Cravvr Plus combines our powerful food truck platform with a professional web presence to help you reach more customers.
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

        {/* Pricing Section */}
        <section className="section section-alt" id="pricing" ref={pricingRef}>
          <div className="container">
            <div className={`section-header-center ${pricingInView ? 'animate-in' : ''}`}>
              <span className="eyebrow">Simple Pricing</span>
              <h2>Invest in Your <span className="gradient-text">Success</span></h2>
              <p className="section-subtitle">
                No hidden fees. No complicated contracts. Just powerful tools to grow your food truck business.
              </p>
            </div>
            <div className="pricing-grid plus-pricing-grid">
              <div className={`price-card featured plus-price-card ${pricingInView ? 'animate-in' : ''}`} style={{ animationDelay: '200ms' }}>
                <div className="price-badge-featured">Cravvr Plus</div>
                <div className="plus-price-header">
                  <p className="plus-price-tagline">Everything you need to dominate online</p>
                </div>
                <div className="plus-price-display">
                  <div className="plus-price-row">
                    <div className="plus-price-amount">
                      <span className="plus-currency">$</span>
                      <span className="plus-value">300</span>
                    </div>
                    <div className="plus-price-label">one-time setup</div>
                  </div>
                  <div className="plus-price-divider">
                    <span>then</span>
                  </div>
                  <div className="plus-price-row">
                    <div className="plus-price-amount">
                      <span className="plus-currency">$</span>
                      <span className="plus-value">40</span>
                    </div>
                    <div className="plus-price-label">/month</div>
                  </div>
                </div>
                <ul className="price-list">
                  <li><span className="check">{Icons.check}</span> Premium Cravvr listing with verified badge</li>
                  <li><span className="check">{Icons.check}</span> Custom-built responsive website</li>
                  <li><span className="check">{Icons.check}</span> SEO optimization & Google submission</li>
                  <li><span className="check">{Icons.check}</span> yourtruck.cravvr.com subdomain</li>
                  <li><span className="check">{Icons.check}</span> Analytics dashboard</li>
                  <li><span className="check">{Icons.check}</span> Menu & schedule management</li>
                  <li><span className="check">{Icons.check}</span> Marketing & promotion tools</li>
                  <li><span className="check">{Icons.check}</span> Priority support</li>
                </ul>
                <a href="#contact" className="btn-primary btn-lg full-width">
                  Get Started
                  <span className="btn-icon">{Icons.arrowRight}</span>
                </a>
                <p className="plus-pricing-note">No contracts. Cancel anytime.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section" id="faq" ref={faqRef}>
          <div className="container">
            <div className={`section-header-center ${faqInView ? 'animate-in' : ''}`}>
              <span className="eyebrow">FAQ</span>
              <h2>Your questions, <span className="gradient-text">answered</span></h2>
            </div>
            <div className="faq-container">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-item ${openFaq === index ? 'open' : ''}`}
                >
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

        {/* CTA / Contact Form Section */}
        <section className="section section-alt" id="contact" ref={ctaRef}>
          <div className="container">
            <div className="waitlist-block plus-waitlist">
              <div className={`section-header-center ${ctaInView ? 'animate-in' : ''}`}>
                <span className="eyebrow">
                  <span className="eyebrow-dot"></span>
                  Ready to grow?
                </span>
                <h2>Let's Build Your <span className="gradient-text">Online Empire</span></h2>
                <p className="section-subtitle">
                  Join the food trucks that are getting found online, building their brand, and growing their customer base with Cravvr Plus.
                </p>
              </div>
              <div className="waitlist-form">
                {submitted ? (
                  <div className="waitlist-success">
                    <div className="success-icon">{Icons.checkCircle}</div>
                    <h3>You're on the list!</h3>
                    <p>Thanks for your interest in Cravvr Plus! We'll reach out soon to get your truck set up.</p>
                    <button
                      className="btn-ghost"
                      onClick={() => setSubmitted(false)}
                    >
                      Add another truck
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
                        <input
                          type="text"
                          id="plus-name"
                          placeholder=" "
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={submitting}
                        />
                        <label htmlFor="plus-name">Your Name</label>
                      </div>
                      <div className="form-field">
                        <input
                          type="email"
                          id="plus-email"
                          placeholder=" "
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={submitting}
                        />
                        <label htmlFor="plus-email">Email Address</label>
                      </div>
                    </div>
                    <div className="form-field">
                      <input
                        type="text"
                        id="plus-truck"
                        placeholder=" "
                        required
                        value={truckName}
                        onChange={(e) => setTruckName(e.target.value)}
                        disabled={submitting}
                      />
                      <label htmlFor="plus-truck">Food Truck Name</label>
                    </div>
                    <button
                      type="submit"
                      className="btn-primary btn-lg full-width"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="btn-spinner">{Icons.loader}</span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          Get Started with Cravvr Plus
                          <span className="btn-icon">{Icons.arrowRight}</span>
                        </>
                      )}
                    </button>
                    <p className="form-disclaimer">
                      By submitting, you agree to be contacted about Cravvr Plus. We'll never spam you.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Matching main site */}
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
              <h4>Cravvr Plus</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
              <a href="#contact">Get Started</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to="/eat">About Cravvr</Link>
              <Link to="/waitlist">Join Waitlist</Link>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
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

export default CravvrPlusPage;

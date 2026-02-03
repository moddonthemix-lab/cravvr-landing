import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/common/Icons';
import { supabase } from '../lib/supabase';
import { useInView } from '../hooks/useInView';
import './CravvrPlusPage.css';

const CravvrPlusPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [truckName, setTruckName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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
      description: 'Your website is built to rank on Google. When hungry customers search, they\'ll find you first.'
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
      question: 'What\'s included in the custom website?',
      answer: 'Your website includes a homepage, menu page, location/schedule page, photo gallery, about section, and contact form. It\'s fully mobile-responsive and designed to convert visitors into customers.'
    },
    {
      question: 'How does SEO optimization work?',
      answer: 'We optimize your site with local keywords, schema markup, fast loading speeds, and mobile-first design. Your site will be submitted to Google and connected to your Google Business Profile for maximum visibility.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes! After your initial setup, you can cancel the monthly subscription anytime. Your website stays live as long as you\'re subscribed.'
    },
    {
      question: 'How long until my website is live?',
      answer: 'Most websites are live within 5-7 business days after you provide your content (menu, photos, schedule). We handle all the technical setup.'
    },
    {
      question: 'Do I need technical skills?',
      answer: 'Not at all! We build everything for you. You\'ll get a simple dashboard to update your menu and schedule, but we\'re always here to help.'
    }
  ];

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="cravvr-plus-page">
      {/* Navigation */}
      <header className="plus-header">
        <div className="container">
          <Link to="/" className="plus-logo">
            <span className="logo-text">Cravvr</span>
            <span className="logo-plus">Plus</span>
          </Link>
          <nav className="plus-nav">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#contact" className="btn-primary btn-sm">Get Started</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="plus-hero" ref={heroRef}>
        <div className="hero-glow"></div>
        <div className="container">
          <div className={`hero-content ${heroInView ? 'animate-in' : ''}`}>
            <span className="eyebrow">
              {Icons.bolt}
              Premium for Food Trucks
            </span>
            <h1>
              Take Your Truck to the <span className="gradient-text">Next Level</span>
            </h1>
            <p className="hero-subtitle">
              Get everything in Cravvr plus a stunning custom website with SEO optimization.
              Be found online, attract more customers, and grow your business.
            </p>
            <div className="hero-cta">
              <a href="#contact" className="btn-primary btn-lg">
                Get Started Today
                {Icons.arrowRight}
              </a>
              <a href="#features" className="btn-ghost btn-lg">
                See What's Included
              </a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-number">3x</span>
                <span className="stat-label">More Visibility</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Online Presence</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Yours to Keep</span>
              </div>
            </div>
          </div>
          <div className={`hero-visual ${heroInView ? 'animate-in' : ''}`} style={{ animationDelay: '200ms' }}>
            <div className="device-mockup">
              <div className="mockup-browser">
                <div className="browser-bar">
                  <div className="browser-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="browser-url">yourtruck.cravvr.com</div>
                </div>
                <div className="browser-content">
                  <div className="mockup-hero-img"></div>
                  <div className="mockup-content">
                    <div className="mockup-title"></div>
                    <div className="mockup-text"></div>
                    <div className="mockup-text short"></div>
                    <div className="mockup-button"></div>
                  </div>
                </div>
              </div>
              <div className="device-phone">
                <div className="phone-notch"></div>
                <div className="phone-content">
                  <div className="phone-header"></div>
                  <div className="phone-card"></div>
                  <div className="phone-card"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="plus-features section" id="features" ref={featuresRef}>
        <div className="container">
          <div className={`section-header-center ${featuresInView ? 'animate-in' : ''}`}>
            <span className="eyebrow">Everything You Need</span>
            <h2>One Platform, <span className="gradient-text">Endless Growth</span></h2>
            <p className="section-subtitle">
              Cravvr Plus combines our powerful food truck platform with a professional web presence to help you reach more customers.
            </p>
          </div>
          <div className="features-grid">
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
      <section className="plus-pricing section section-alt" id="pricing" ref={pricingRef}>
        <div className="container">
          <div className={`section-header-center ${pricingInView ? 'animate-in' : ''}`}>
            <span className="eyebrow">Simple Pricing</span>
            <h2>Invest in Your <span className="gradient-text">Success</span></h2>
            <p className="section-subtitle">
              No hidden fees. No complicated contracts. Just powerful tools to grow your food truck business.
            </p>
          </div>
          <div className={`pricing-card-wrapper ${pricingInView ? 'animate-in' : ''}`} style={{ animationDelay: '200ms' }}>
            <div className="pricing-card">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-header">
                <h3>Cravvr Plus</h3>
                <p className="pricing-tagline">Everything you need to dominate online</p>
              </div>
              <div className="pricing-amount">
                <div className="price-setup">
                  <span className="price-currency">$</span>
                  <span className="price-value">300</span>
                  <span className="price-period">one-time setup</span>
                </div>
                <div className="price-divider">
                  <span>then</span>
                </div>
                <div className="price-monthly">
                  <span className="price-currency">$</span>
                  <span className="price-value">40</span>
                  <span className="price-period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>
                  <span className="check-icon">{Icons.check}</span>
                  Premium Cravvr listing with verified badge
                </li>
                <li>
                  <span className="check-icon">{Icons.check}</span>
                  Custom-built responsive website
                </li>
                <li>
                  <span className="check-icon">{Icons.check}</span>
                  SEO optimization & Google submission
                </li>
                <li>
                  <span className="check-icon">{Icons.check}</span>
                  yourtruck.cravvr.com subdomain
                </li>
                <li>
                  <span className="check-icon">{Icons.check}</span>
                  Analytics dashboard
                </li>
                <li>
                  <span className="check-icon">{Icons.check}</span>
                  Menu & schedule management
                </li>
                <li>
                  <span className="check-icon">{Icons.check}</span>
                  Marketing & promotion tools
                </li>
                <li>
                  <span className="check-icon">{Icons.check}</span>
                  Priority support
                </li>
              </ul>
              <a href="#contact" className="btn-primary btn-lg full-width">
                Get Started
                {Icons.arrowRight}
              </a>
              <p className="pricing-note">No contracts. Cancel anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="plus-faq section" id="faq" ref={faqRef}>
        <div className="container">
          <div className={`section-header-center ${faqInView ? 'animate-in' : ''}`}>
            <span className="eyebrow">Questions?</span>
            <h2>Frequently Asked <span className="gradient-text">Questions</span></h2>
          </div>
          <div className={`faq-list ${faqInView ? 'animate-in' : ''}`} style={{ animationDelay: '200ms' }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${openFaq === index ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <div className="faq-question">
                  <h4>{faq.question}</h4>
                  <span className="faq-toggle">{Icons.chevronDown}</span>
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact Form Section */}
      <section className="plus-cta section section-alt" id="contact" ref={ctaRef}>
        <div className="cta-glow"></div>
        <div className="container">
          <div className={`cta-content ${ctaInView ? 'animate-in' : ''}`}>
            <div className="cta-text">
              <span className="eyebrow">Ready to Grow?</span>
              <h2>Let's Build Your <span className="gradient-text">Online Empire</span></h2>
              <p>
                Join the food trucks that are getting found online, building their brand, and growing their customer base with Cravvr Plus.
              </p>
              <div className="cta-features">
                <div className="cta-feature">
                  {Icons.check}
                  <span>Website live in 5-7 days</span>
                </div>
                <div className="cta-feature">
                  {Icons.check}
                  <span>We handle all the tech</span>
                </div>
                <div className="cta-feature">
                  {Icons.check}
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
            <div className="cta-form-wrapper">
              {submitted ? (
                <div className="form-success">
                  <div className="success-icon">{Icons.checkCircle}</div>
                  <h3>You're on the list!</h3>
                  <p>Thanks for your interest in Cravvr Plus! We'll reach out soon to get your truck set up.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="cta-form">
                  <h3>Get Started Today</h3>
                  <p>Fill out the form and we'll reach out to set up your Cravvr Plus account.</p>

                  <div className="form-fields">
                    <div className="form-field">
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder=" "
                        required
                      />
                      <label htmlFor="name">Your Name</label>
                    </div>
                    <div className="form-field">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=" "
                        required
                      />
                      <label htmlFor="email">Email Address</label>
                    </div>
                    <div className="form-field">
                      <input
                        type="text"
                        id="truckName"
                        value={truckName}
                        onChange={(e) => setTruckName(e.target.value)}
                        placeholder=" "
                        required
                      />
                      <label htmlFor="truckName">Food Truck Name</label>
                    </div>
                  </div>

                  {error && (
                    <div className="form-error">
                      <span className="error-icon">{Icons.alertCircle}</span>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary btn-lg full-width"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Get Started
                        {Icons.arrowRight}
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

      {/* Footer */}
      <footer className="plus-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Link to="/" className="plus-logo">
                <span className="logo-text">Cravvr</span>
                <span className="logo-plus">Plus</span>
              </Link>
              <p>Helping food trucks get found, build their brand, and grow their business.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#faq">FAQ</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <Link to="/eat">Cravvr</Link>
                <Link to="/waitlist">Join Waitlist</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Cravvr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CravvrPlusPage;

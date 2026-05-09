import React, { useState } from 'react';
import { DeviceFrameset } from 'react-device-frameset';
import 'react-device-frameset/styles/marvel-devices.min.css';
import { useInView } from '../../hooks/useInView';
import { joinWaitlist } from '../../services/waitlist';
import { Icons } from '../common/Icons';
import Header from './Header';

// ============================================
// LANDING PAGE DATA
// ============================================

const categories = [
  { label: 'Pizza', icon: '🍕' },
  { label: 'Burgers', icon: '🍔' },
  { label: 'Tacos', icon: '🌮' },
  { label: 'BBQ', icon: '🍖' },
  { label: 'Breakfast', icon: '🍳' }
];

const faqs = [
  {
    q: 'How is Cravrr different from other food apps?',
    a: 'Cravrr focuses exclusively on food trucks with 0% commission on pickup orders. We provide direct connections between trucks and their followers, not algorithms.'
  },
  {
    q: 'Do I need a POS system?',
    a: 'Not at all — but if you already use Stripe, Square, or Clover, you can connect them for free in a few minutes and start accepting online orders immediately. No setup fees, no per-transaction commission from Cravvr.'
  },
  {
    q: 'How do customers find my truck?',
    a: 'Our map-first app shows your real-time location. Followers get push notifications when you\'re nearby or open for business.'
  },
  {
    q: 'When will Cravrr launch?',
    a: 'We\'re currently in early access in select cities. Join the waitlist to be among the first to try it in your area.'
  }
];

const statItems = [
  { value: '0%', label: 'Commission on pickup', icon: Icons.dollarSign },
  { value: '2.5K+', label: 'Trucks on waitlist', icon: Icons.truck },
  { value: '24/7', label: 'Real-time tracking', icon: Icons.mapPin },
  { value: '$0', label: 'Setup fees ever', icon: Icons.creditCard }
];

const features = [
  { icon: Icons.mapPin, title: 'Discover Nearby', body: 'Find food trucks by cuisine, location, or ratings—updated in real-time as trucks move.' },
  { icon: Icons.map, title: 'Live Map View', body: 'See exactly where your favorite trucks are parked right now with our interactive map.' },
  { icon: Icons.bell, title: 'Smart Alerts', body: 'Get notified instantly when trucks you follow are nearby or running specials.' },
  { icon: Icons.star, title: 'Earn Rewards', body: 'VIP passes, digital punch cards, and exclusive deals from trucks you love.' },
  { icon: Icons.chart, title: 'Route Analytics', body: 'Trucks get demand heatmaps, customer insights, and optimal location suggestions.' },
  { icon: Icons.creditCard, title: 'Easy Payments', body: 'Skip the line with mobile ordering and contactless pickup—no cash needed.' }
];

const stepsLovers = [
  { num: '1', title: 'Browse the Map', body: 'See all food trucks near you in real-time' },
  { num: '2', title: 'Follow Favorites', body: "Get notified when they're nearby or open" },
  { num: '3', title: 'Order & Pickup', body: 'Skip the line with mobile ordering' },
  { num: '4', title: 'Earn Rewards', body: 'Unlock VIP perks and exclusive deals' }
];

const stepsTrucks = [
  { num: '1', title: 'Go Live', body: 'Update your location with one tap' },
  { num: '2', title: 'Build Following', body: 'Customers follow for instant updates' },
  { num: '3', title: 'Take Orders', body: '0% commission on all pickup orders' },
  { num: '4', title: 'Grow Smarter', body: 'Use analytics to find the best spots' }
];

const valueProps = [
  { icon: Icons.dollarSign, text: '0% fees on pickup' },
  { icon: Icons.trendingUp, text: 'Demand heatmaps' },
  { icon: Icons.ticket, text: 'Digital punch cards' },
  { icon: Icons.megaphone, text: 'Direct to followers' }
];

// ============================================
// HELPER COMPONENTS
// ============================================

const PhoneMockup = () => (
  <div className="phone-mockup-wrapper">
    <div className="phone-glow"></div>
    <DeviceFrameset device="iPhone X" color="black" zoom={0.75}>
      <div className="phone-screen-content">
        <div className="mock-header">
          <span className="mock-menu">{Icons.menu}</span>
          <span className="mock-title">Browse</span>
          <span className="mock-filter">Filter</span>
        </div>
        <div className="mock-search">
          <span>🔍</span>
          <span>Search for trucks...</span>
        </div>
        <div className="mock-categories">
          {categories.map((c) => (
            <div key={c.label} className={`mock-cat ${c.label === 'Tacos' ? 'active' : ''}`}>
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </div>
          ))}
        </div>
        <div className="mock-section-title">
          <span>Nearby trucks</span>
          <span className="mock-link">Map →</span>
        </div>
        <div className="mock-card">
          <div className="mock-card-img">
            <div className="mock-promoted">LIVE</div>
            <div className="mock-rating">★ 4.8</div>
          </div>
          <div className="mock-card-body">
            <div className="mock-card-title">Taco Loco Express</div>
            <div className="mock-card-meta">Mexican • Street Food</div>
            <div className="mock-card-row">
              <span>📍 0.3 mi away</span>
              <span>Open now</span>
            </div>
          </div>
        </div>
        <div className="mock-card">
          <div className="mock-card-img second">
            <div className="mock-rating">★ 4.9</div>
          </div>
          <div className="mock-card-body">
            <div className="mock-card-title">Seoul BBQ</div>
            <div className="mock-card-meta">Korean • BBQ</div>
            <div className="mock-card-row">
              <span>📍 0.5 mi away</span>
              <span>Open now</span>
            </div>
          </div>
        </div>
        <div className="mock-bottom-nav">
          <div className="mock-nav-item active">
            <span>🏠</span>
            <span>Home</span>
          </div>
          <div className="mock-nav-item">
            <span>🗺️</span>
            <span>Map</span>
          </div>
          <div className="mock-nav-item cart">
            <span>🛒</span>
          </div>
          <div className="mock-nav-item">
            <span>❤️</span>
            <span>Saved</span>
          </div>
          <div className="mock-nav-item">
            <span>👤</span>
            <span>Profile</span>
          </div>
        </div>
      </div>
    </DeviceFrameset>
  </div>
);

const FAQItem = ({ faq, isOpen, onClick }) => (
  <div className={`faq-item ${isOpen ? 'open' : ''}`}>
    <button className="faq-question" onClick={onClick} aria-expanded={isOpen}>
      <span>{faq.q}</span>
      <span className="faq-icon">{Icons.chevronDown}</span>
    </button>
    <div className="faq-answer">
      <p>{faq.a}</p>
    </div>
  </div>
);

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-container">
      <div className="footer-brand">
        <a href="/" className="logo">
          <img src="/logo/cravrr-logo-transparent.png" alt="Cravrr" className="footer-logo-image" />
        </a>
        <p>The map-first food truck platform that connects hungry eaters with amazing local trucks.</p>
        <div className="social-links">
          <a href="#twitter" aria-label="Twitter">{Icons.twitter}</a>
          <a href="#instagram" aria-label="Instagram">{Icons.instagram}</a>
          <a href="#facebook" aria-label="Facebook">{Icons.facebook}</a>
        </div>
      </div>

      <div className="footer-links">
        <div className="footer-col">
          <h4>Product</h4>
          <a href="/eat">About Cravvr</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="#careers">Careers</a>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
      </div>
    </div>

    <div className="footer-bottom">
      <p>© 2025 Cravrr. All rights reserved.</p>
      <p className="footer-tagline">Made with ❤️ for food trucks everywhere</p>
    </div>
  </footer>
);

// ============================================
// LANDING PAGE COMPONENT
// ============================================

const LandingPage = ({ setCurrentView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waitlistType, setWaitlistType] = useState('lover');
  const [openFaq, setOpenFaq] = useState(0);
  const [heroRef, heroInView] = useInView();

  // Waitlist form state
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  // Handle waitlist form submission
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
    <div className="page">
      <Header
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setCurrentView={setCurrentView}
      />

      <main id="main">
        {/* Hero Section */}
        <section className="hero" ref={heroRef}>
          <div className={`hero-content ${heroInView ? 'animate-in' : ''}`}>
            <div className="hero-text">
              <span className="eyebrow">
                <span className="eyebrow-dot"></span>
                Now in early access
              </span>
              <h1>
                The food truck app that puts{' '}
                <span className="gradient-text">trucks & eaters</span>{' '}
                first.
              </h1>
              <p className="lede">
                Cravrr gives eaters a beautiful map-first experience and gives trucks the direct, low-fee revenue channel they deserve.
              </p>
              <div className="hero-actions">
                <button onClick={() => setCurrentView('home')} className="btn-primary btn-lg">
                  Start Ordering
                  <span className="btn-icon">{Icons.arrowRight}</span>
                </button>
                <a href="#waitlist" className="btn-ghost btn-lg">
                  Join Waitlist
                </a>
              </div>
              <div className="hero-social-proof">
                <div className="avatar-stack">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=50&q=80" alt="" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&q=80" alt="" />
                  <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=50&q=80" alt="" />
                  <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=50&q=80" alt="" />
                </div>
                <p><strong>2,500+</strong> trucks & eaters on the waitlist</p>
              </div>
            </div>
            <div className="hero-device">
              <PhoneMockup />
            </div>
          </div>
          <div className="hero-stats">
            {statItems.map((s, i) => (
              <div className="stat" key={s.label} style={{ animationDelay: `${i * 100 + 400}ms` }}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-content">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="section" id="features">
          <div className="container">
            <div className="section-header-center">
              <span className="eyebrow">Powerful features</span>
              <h2>Everything you need to <span className="gradient-text">discover & follow</span> food trucks</h2>
              <p className="section-subtitle">
                A map-first app that makes finding food trucks effortless for eaters, and running a business easier for trucks.
              </p>
            </div>
            <div className="feature-grid">
              {features.map((f, i) => {
                const [ref, isInView] = useInView();
                return (
                  <div
                    ref={ref}
                    className={`feature-card ${isInView ? 'animate-in' : ''}`}
                    key={f.title}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="feature-icon">{f.icon}</div>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="section section-alt" id="how-it-works">
          <div className="container">
            <div className="section-header-center">
              <span className="eyebrow">How it works</span>
              <h2>Simple for <span className="gradient-text">everyone</span></h2>
            </div>
            <div className="two-col-grid">
              <div className="steps-block">
                <div className="steps-header">
                  <span className="steps-icon lovers">{Icons.heart}</span>
                  <h3 className="steps-title">For Food Lovers</h3>
                </div>
                <div className="steps">
                  {stepsLovers.map((s) => (
                    <div className="step" key={s.num}>
                      <div className="step-num">{s.num}</div>
                      <div className="step-content">
                        <h4>{s.title}</h4>
                        <p>{s.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="steps-block alt">
                <div className="steps-header">
                  <span className="steps-icon trucks">{Icons.truck}</span>
                  <h3 className="steps-title">For Food Trucks</h3>
                </div>
                <div className="steps">
                  {stepsTrucks.map((s) => (
                    <div className="step" key={s.num}>
                      <div className="step-num alt">{s.num}</div>
                      <div className="step-content">
                        <h4>{s.title}</h4>
                        <p>{s.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="section" id="pricing">
          <div className="container">
            <div className="section-header-center">
              <span className="eyebrow">Fair pricing</span>
              <h2>No predatory <span className="gradient-text">commissions</span></h2>
              <p className="section-subtitle">Keep more of what you earn. We believe in fair fees that help trucks thrive.</p>
            </div>
            <div className="pricing-grid">
              <div className="price-card">
                <div className="price-badge">For Food Trucks</div>
                <div className="price">0%</div>
                <p className="price-desc">Commission on pickup orders</p>
                <ul className="price-list">
                  <li><span className="check">{Icons.check}</span> No setup fees</li>
                  <li><span className="check">{Icons.check}</span> Route analytics dashboard</li>
                  <li><span className="check">{Icons.check}</span> Customer insights & data</li>
                  <li><span className="check">{Icons.check}</span> Direct payment processing</li>
                  <li><span className="check">{Icons.check}</span> Push notifications to followers</li>
                </ul>
                <a href="#waitlist" className="btn-primary full-width">Get Started Free</a>
              </div>
              <div className="price-card featured">
                <div className="price-badge-featured">Most Popular</div>
                <div className="price-badge">For Eaters</div>
                <div className="price">Free</div>
                <p className="price-desc">Beautiful map-first experience</p>
                <ul className="price-list">
                  <li><span className="check">{Icons.check}</span> Find trucks near you</li>
                  <li><span className="check">{Icons.check}</span> Follow your favorites</li>
                  <li><span className="check">{Icons.check}</span> Exclusive deals & offers</li>
                  <li><span className="check">{Icons.check}</span> Easy mobile ordering</li>
                  <li><span className="check">{Icons.check}</span> Loyalty rewards</li>
                </ul>
                <a href="#waitlist" className="btn-primary full-width">Join Waitlist</a>
              </div>
            </div>
          </div>
        </section>

        {/* Value Props Section */}
        <section className="section section-alt">
          <div className="container">
            <div className="section-header-center">
              <span className="eyebrow">Built for loyalty</span>
              <h2>Tools to build lasting <span className="gradient-text">relationships</span></h2>
            </div>
            <div className="value-grid">
              {valueProps.map((v) => (
                <div className="value-card" key={v.text}>
                  <span className="value-icon">{v.icon}</span>
                  <span>{v.text}</span>
                </div>
              ))}
            </div>
            <div className="loyalty-grid">
              <div className="loyalty-card">
                <div className="loyalty-icon">{Icons.ticket}</div>
                <h3>VIP Passes</h3>
                <p>Offer monthly subscriptions for your biggest fans with exclusive perks and early access.</p>
              </div>
              <div className="loyalty-card">
                <div className="loyalty-icon">{Icons.target}</div>
                <h3>Punch Cards</h3>
                <p>Digital loyalty cards that customers actually use—no more lost paper cards.</p>
              </div>
              <div className="loyalty-card">
                <div className="loyalty-icon">{Icons.gift}</div>
                <h3>Exclusive Deals</h3>
                <p>Send special offers directly to your followers, not buried in an algorithm.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section" id="faq">
          <div className="container">
            <div className="section-header-center">
              <span className="eyebrow">FAQ</span>
              <h2>Your questions, <span className="gradient-text">answered</span></h2>
            </div>
            <div className="faq-container">
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

        {/* Waitlist Section */}
        <section className="section section-alt" id="waitlist">
          <div className="container">
            <div className="waitlist-block">
              <div className="section-header-center">
                <span className="eyebrow">
                  <span className="eyebrow-dot"></span>
                  Limited early access
                </span>
                <h2>Be first in line when we <span className="gradient-text">launch</span></h2>
                <p className="section-subtitle">Join 2,500+ trucks and eaters already on the waitlist. Get early access and exclusive perks.</p>
              </div>
              <div className="waitlist-form">
                {waitlistSuccess ? (
                  <div className="waitlist-success">
                    <div className="success-icon">{Icons.checkCircle}</div>
                    <h3>You're on the list!</h3>
                    <p>Thanks for joining! We'll notify you when Cravrr launches in your area.</p>
                    <button
                      className="btn-ghost"
                      onClick={() => setWaitlistSuccess(false)}
                    >
                      Add another email
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="waitlist-toggle">
                      <button
                        className={`toggle-btn ${waitlistType === 'lover' ? 'active' : ''}`}
                        onClick={() => setWaitlistType('lover')}
                      >
                        <span className="toggle-icon">🍔</span>
                        I'm a Food Lover
                      </button>
                      <button
                        className={`toggle-btn ${waitlistType === 'truck' ? 'active' : ''}`}
                        onClick={() => setWaitlistType('truck')}
                      >
                        <span className="toggle-icon">🚚</span>
                        I Run a Truck
                      </button>
                    </div>
                    <form className="form-fields" onSubmit={handleWaitlistSubmit}>
                      {waitlistError && (
                        <div className="form-error">
                          <span className="error-icon">{Icons.alertCircle}</span>
                          {waitlistError}
                        </div>
                      )}
                      <div className="form-row">
                        <div className="form-field">
                          <input
                            type="text"
                            id="waitlist-name"
                            placeholder=" "
                            required
                            value={waitlistName}
                            onChange={(e) => setWaitlistName(e.target.value)}
                            disabled={waitlistSubmitting}
                          />
                          <label htmlFor="waitlist-name">Your Name</label>
                        </div>
                        <div className="form-field">
                          <input
                            type="email"
                            id="waitlist-email"
                            placeholder=" "
                            required
                            value={waitlistEmail}
                            onChange={(e) => setWaitlistEmail(e.target.value)}
                            disabled={waitlistSubmitting}
                          />
                          <label htmlFor="waitlist-email">Email Address</label>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn-primary btn-lg full-width"
                        disabled={waitlistSubmitting}
                      >
                        {waitlistSubmitting ? (
                          <>
                            <span className="btn-spinner">{Icons.loader}</span>
                            Joining...
                          </>
                        ) : (
                          <>
                            Get Early Access
                            <span className="btn-icon">{Icons.arrowRight}</span>
                          </>
                        )}
                      </button>
                      <p className="form-disclaimer">No spam, ever. Unsubscribe anytime.</p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;

import React, { useState, useEffect, useRef } from 'react';

// SVG Icons
const Icons = {
  mapPin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
      <line x1="8" y1="2" x2="8" y2="18"></line>
      <line x1="16" y1="6" x2="16" y2="22"></line>
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  creditCard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  heartFilled: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  dollarSign: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  ),
  trendingUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
      <path d="M13 5v2"></path>
      <path d="M13 17v2"></path>
      <path d="M13 11v2"></path>
    </svg>
  ),
  megaphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 13v-2z"></path>
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"></polyline>
      <rect x="2" y="7" width="20" height="5"></rect>
      <line x1="12" y1="22" x2="12" y2="7"></line>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  )
};

// Data
const categories = [
  { label: 'Pizza', icon: '🍕' },
  { label: 'Burgers', icon: '🍔' },
  { label: 'Tacos', icon: '🌮' },
  { label: 'BBQ', icon: '🍖' },
  { label: 'Breakfast', icon: '🍳' }
];

const cards = [
  {
    title: "Famous Dave's BBQ",
    tags: ['BBQ', 'American', 'Comfort'],
    time: '15-30 min',
    price: '$25 avg',
    rating: '4.8',
    reviews: '300+',
    offer: 'OSAHAN50',
    promoted: true,
    liked: false,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Thai Street Kitchen',
    tags: ['Thai', 'Asian', 'Spicy'],
    time: '20-35 min',
    price: '$18 avg',
    rating: '4.9',
    reviews: '150+',
    offer: '20% OFF',
    promoted: false,
    liked: true,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Taco Loco Express',
    tags: ['Mexican', 'Street Food'],
    time: '10-20 min',
    price: '$12 avg',
    rating: '4.7',
    reviews: '500+',
    offer: 'Free delivery',
    promoted: true,
    liked: true,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80'
  }
];

const faqs = [
  {
    q: 'How is Cravrr different from other food delivery apps?',
    a: 'Cravrr focuses exclusively on food trucks with 0% commission on pickup orders. We provide direct connections between trucks and their followers, not algorithms.'
  },
  {
    q: 'Do I need a POS system?',
    a: 'No. Cravrr is designed to be simple. No complicated POS integrations required—just your phone and your food.'
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

const testimonials = [
  {
    name: 'Maria G.',
    role: 'Taco Truck Owner',
    text: 'Finally an app that doesn\'t take 30% of my earnings. My regulars love the notifications!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
  },
  {
    name: 'James T.',
    role: 'Food Lover',
    text: 'I discovered 3 amazing trucks I never knew existed in my neighborhood. Game changer.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'
  },
  {
    name: 'Sarah K.',
    role: 'BBQ Truck Owner',
    text: 'The route analytics helped me find the perfect lunch spots. Revenue up 40%!',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80'
  }
];

// Intersection Observer Hook for animations
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
};

// Components
const Header = ({ mobileMenuOpen, setMobileMenuOpen }) => (
  <header className="site-header">
    <a href="#main" className="skip-link">Skip to main content</a>
    <div className="header-container">
      <a href="/" className="logo">
        <span className="logo-icon">{Icons.truck}</span>
        <span className="logo-text">Cravrr</span>
      </a>

      <nav className="desktop-nav">
        <a href="#features">Features</a>
        <a href="#how-it-works">How it Works</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
      </nav>

      <div className="header-actions">
        <a href="#waitlist" className="btn-primary btn-sm">
          Join Waitlist
          <span className="btn-icon">{Icons.arrowRight}</span>
        </a>
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
        <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
        <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
        <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
      </nav>
      <a href="#waitlist" className="btn-primary mobile-cta" onClick={() => setMobileMenuOpen(false)}>
        Join Waitlist
      </a>
    </div>
  </header>
);

const PhoneMockup = () => (
  <div className="phone-mockup">
    <div className="phone-glow"></div>
    <div className="phone-frame">
      <div className="phone-notch"></div>
      <div className="phone-screen">
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
    </div>
  </div>
);

const Card = ({ data, index }) => {
  const [ref, isInView] = useInView();

  return (
    <div
      ref={ref}
      className={`card ${isInView ? 'animate-in' : ''}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="card-media">
        <img src={data.image} alt={data.title} loading="lazy" />
        {data.promoted && <span className="pill promoted">Promoted</span>}
        <button className={`heart ${data.liked ? 'active' : ''}`} aria-label="favorite">
          {data.liked ? Icons.heartFilled : Icons.heart}
        </button>
        <span className="pill rating">
          <span className="rating-star">{Icons.star}</span>
          {data.rating}
        </span>
      </div>
      <div className="card-body">
        <h3>{data.title}</h3>
        <p className="meta">{data.tags.join(' • ')}</p>
        <div className="card-row">
          <span className="card-time">
            <span className="card-icon">{Icons.clock}</span>
            {data.time}
          </span>
          <span className="muted">{data.price}</span>
        </div>
        <div className="offer">{data.offer}</div>
      </div>
    </div>
  );
};

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

const TestimonialCard = ({ testimonial, index }) => {
  const [ref, isInView] = useInView();

  return (
    <div
      ref={ref}
      className={`testimonial-card ${isInView ? 'animate-in' : ''}`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="testimonial-content">
        <p>"{testimonial.text}"</p>
      </div>
      <div className="testimonial-author">
        <img src={testimonial.avatar} alt={testimonial.name} />
        <div>
          <strong>{testimonial.name}</strong>
          <span>{testimonial.role}</span>
        </div>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-container">
      <div className="footer-brand">
        <a href="/" className="logo">
          <span className="logo-icon">{Icons.truck}</span>
          <span className="logo-text">Cravrr</span>
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

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waitlistType, setWaitlistType] = useState('lover');
  const [openFaq, setOpenFaq] = useState(0);
  const [heroRef, heroInView] = useInView();

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

  return (
    <div className="page">
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

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
                <a href="#waitlist" className="btn-primary btn-lg">
                  Join the Waitlist
                  <span className="btn-icon">{Icons.arrowRight}</span>
                </a>
                <a href="#features" className="btn-ghost btn-lg">Learn More</a>
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

        {/* Social Proof / Testimonials */}
        <section className="section section-alt">
          <div className="container">
            <div className="section-header-center">
              <span className="eyebrow">Loved by trucks & eaters</span>
              <h2>Don't just take our word for it</h2>
            </div>
            <div className="testimonial-grid">
              {testimonials.map((t, i) => (
                <TestimonialCard key={t.name} testimonial={t} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Trending Trucks Section */}
        <section className="section">
          <div className="container">
            <div className="section-header-left">
              <div>
                <span className="eyebrow">Coming soon</span>
                <h2>Trending Trucks</h2>
              </div>
              <button className="btn-ghost btn-sm">
                View all
                <span className="btn-icon">{Icons.arrowRight}</span>
              </button>
            </div>
            <div className="card-grid">
              {cards.map((card, i) => (
                <Card data={card} key={card.title} index={i} />
              ))}
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
                <form className="form-fields" onSubmit={(e) => e.preventDefault()}>
                  <div className="form-row">
                    <div className="form-field">
                      <input type="text" id="name" placeholder=" " required />
                      <label htmlFor="name">Your Name</label>
                    </div>
                    <div className="form-field">
                      <input type="email" id="email" placeholder=" " required />
                      <label htmlFor="email">Email Address</label>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary btn-lg full-width">
                    Get Early Access
                    <span className="btn-icon">{Icons.arrowRight}</span>
                  </button>
                  <p className="form-disclaimer">No spam, ever. Unsubscribe anytime.</p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default App;

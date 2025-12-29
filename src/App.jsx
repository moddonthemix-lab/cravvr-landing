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
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
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
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
    </svg>
  ),
  compass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  )
};

// Mock Data
const mockTrucks = [
  {
    id: 1,
    name: "Taco Paradise",
    image: "🌮",
    description: "Authentic Mexican street tacos with fresh ingredients",
    cuisine: "Mexican",
    location: "Downtown Portland",
    distance: "0.5 mi",
    rating: 4.8,
    reviewCount: 128,
    isOpen: true,
    hours: "11am - 10pm",
    priceRange: "$$",
    features: ["Vegan Options", "Gluten Free", "Halal"],
    tags: ["mexican", "vegan", "glutenFree", "halal"],
    featured: true,
    coordinates: { lat: 45.5231, lng: -122.6765 },
    menuItems: [
      { id: 1, name: "Fish Tacos", price: "$12", emoji: "🐟", description: "Fresh caught fish with cilantro lime slaw" },
      { id: 2, name: "Shrimp Ceviche", price: "$14", emoji: "🦐", description: "Lime-marinated shrimp with avocado" },
      { id: 3, name: "Lobster Roll", price: "$18", emoji: "🦞", description: "Maine lobster on a toasted bun" }
    ]
  },
  {
    id: 2,
    name: "Burger Bros",
    image: "🍔",
    description: "Gourmet burgers and hand-cut fries",
    cuisine: "American",
    location: "Pearl District",
    distance: "1.2 mi",
    rating: 4.6,
    reviewCount: 95,
    isOpen: true,
    hours: "10am - 9pm",
    priceRange: "$$$",
    features: ["Outdoor Seating", "Late Night"],
    tags: ["american", "burgers"],
    featured: false,
    coordinates: { lat: 45.5295, lng: -122.6819 },
    menuItems: [
      { id: 1, name: "Classic Burger", price: "$14", emoji: "🍔", description: "Angus beef with all the fixings" },
      { id: 2, name: "Truffle Fries", price: "$8", emoji: "🍟", description: "Hand-cut with truffle oil" },
      { id: 3, name: "Milkshake", price: "$6", emoji: "🥤", description: "House-made vanilla shake" }
    ]
  },
  {
    id: 3,
    name: "Thai Street Food",
    image: "🍜",
    description: "Authentic Thai cuisine from Bangkok",
    cuisine: "Thai",
    location: "Southeast Portland",
    distance: "2.1 mi",
    rating: 4.9,
    reviewCount: 156,
    isOpen: false,
    hours: "12pm - 8pm",
    priceRange: "$$",
    features: ["Vegan Options", "Dairy Free"],
    tags: ["thai", "vegan", "dairyFree"],
    featured: true,
    coordinates: { lat: 45.5089, lng: -122.6359 },
    menuItems: [
      { id: 1, name: "Pad Thai", price: "$13", emoji: "🍝", description: "Classic Thai rice noodles" },
      { id: 2, name: "Green Curry", price: "$14", emoji: "🍛", description: "Coconut curry with vegetables" },
      { id: 3, name: "Mango Sticky Rice", price: "$8", emoji: "🥭", description: "Sweet coconut rice with fresh mango" }
    ]
  },
  {
    id: 4,
    name: "Pizza on Wheels",
    image: "🍕",
    description: "Wood-fired artisan pizza",
    cuisine: "Italian",
    location: "Northwest Portland",
    distance: "1.8 mi",
    rating: 4.7,
    reviewCount: 112,
    isOpen: true,
    hours: "11am - 11pm",
    priceRange: "$$",
    features: ["Vegan Options", "Gluten Free"],
    tags: ["pizza", "italian", "vegan", "glutenFree"],
    featured: true,
    coordinates: { lat: 45.5370, lng: -122.7042 },
    menuItems: [
      { id: 1, name: "Margherita", price: "$16", emoji: "🍕", description: "Fresh mozzarella, basil, tomato" },
      { id: 2, name: "Pepperoni", price: "$18", emoji: "🍕", description: "Classic pepperoni with cheese" },
      { id: 3, name: "Vegan Supreme", price: "$17", emoji: "🥬", description: "Plant-based cheese and veggies" }
    ]
  },
  {
    id: 5,
    name: "Coffee Cart",
    image: "☕",
    description: "Specialty coffee and fresh pastries",
    cuisine: "Coffee",
    location: "Downtown Portland",
    distance: "0.3 mi",
    rating: 4.5,
    reviewCount: 87,
    isOpen: true,
    hours: "6am - 2pm",
    priceRange: "$",
    features: ["Vegan Options", "Dairy Free"],
    tags: ["coffee", "snacks", "vegan", "dairyFree"],
    featured: false,
    coordinates: { lat: 45.5202, lng: -122.6742 },
    menuItems: [
      { id: 1, name: "Latte", price: "$5", emoji: "☕", description: "Espresso with steamed milk" },
      { id: 2, name: "Croissant", price: "$4", emoji: "🥐", description: "Buttery, flaky pastry" },
      { id: 3, name: "Avocado Toast", price: "$8", emoji: "🥑", description: "Smashed avocado on sourdough" }
    ]
  },
  {
    id: 6,
    name: "Sea Shack",
    image: "🦞",
    description: "Fresh seafood dishes daily",
    cuisine: "Seafood",
    location: "Waterfront",
    distance: "3.2 mi",
    rating: 4.9,
    reviewCount: 167,
    isOpen: false,
    hours: "12pm - 9pm",
    priceRange: "$$$",
    features: ["Gluten Free Options"],
    tags: ["seafood", "glutenFree"],
    featured: true,
    coordinates: { lat: 45.5155, lng: -122.6719 },
    menuItems: [
      { id: 1, name: "Fish & Chips", price: "$15", emoji: "🐟", description: "Beer-battered cod with fries" },
      { id: 2, name: "Clam Chowder", price: "$12", emoji: "🥣", description: "Creamy New England style" },
      { id: 3, name: "Lobster Roll", price: "$22", emoji: "🦞", description: "Maine lobster on a toasted bun" }
    ]
  }
];

const mockEvents = [
  {
    id: 1,
    name: "Food Truck Friday",
    date: "Jan 17, 2025",
    time: "5:00 PM - 9:00 PM",
    location: "Pioneer Square",
    description: "Weekly gathering of Portland's best food trucks",
    attendees: 145,
    image: "🎉",
    featured: true,
    trucks: [1, 2, 4]
  },
  {
    id: 2,
    name: "Taste of Portland",
    date: "Jan 22, 2025",
    time: "12:00 PM - 8:00 PM",
    location: "Waterfront Park",
    description: "Annual food truck festival featuring local favorites",
    attendees: 430,
    image: "🍴",
    featured: true,
    trucks: [1, 2, 3, 4, 5, 6]
  },
  {
    id: 3,
    name: "Late Night Bites",
    date: "Jan 18, 2025",
    time: "8:00 PM - 12:00 AM",
    location: "Downtown Food Pod",
    description: "After-hours food truck meetup",
    attendees: 67,
    image: "🌙",
    featured: false,
    trucks: [2, 4]
  }
];

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

// Intersection Observer Hook
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

// ============================================
// SHARED COMPONENTS
// ============================================

const Header = ({ mobileMenuOpen, setMobileMenuOpen, currentView, setCurrentView }) => (
  <header className="site-header">
    <a href="#main" className="skip-link">Skip to main content</a>
    <div className="header-container">
      <a href="/" className="logo" onClick={(e) => { e.preventDefault(); setCurrentView('landing'); }}>
        <span className="logo-icon">{Icons.truck}</span>
        <span className="logo-text">Cravrr</span>
      </a>

      <nav className="desktop-nav">
        <a href="#features">Features</a>
        <a href="#how-it-works">How it Works</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
        <button onClick={() => setCurrentView('app')} className="nav-app-link">Try Demo</button>
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
        <button onClick={() => { setCurrentView('app'); setMobileMenuOpen(false); }} className="nav-app-link">Try Demo</button>
      </nav>
      <a href="#waitlist" className="btn-primary mobile-cta" onClick={() => setMobileMenuOpen(false)}>
        Join Waitlist
      </a>
    </div>
  </header>
);

const AppHeader = ({ title, onBack, rightAction }) => (
  <header className="app-header">
    <div className="app-header-container">
      {onBack && (
        <button className="app-back-btn" onClick={onBack}>
          <span className="icon-sm">{Icons.chevronLeft}</span>
        </button>
      )}
      <h1 className="app-header-title">{title}</h1>
      {rightAction && <div className="app-header-right">{rightAction}</div>}
    </div>
  </header>
);

const BottomNav = ({ activeTab, setActiveTab }) => (
  <nav className="bottom-nav">
    <button className={`bottom-nav-item ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}>
      <span className="bottom-nav-icon">{Icons.compass}</span>
      <span>Explore</span>
    </button>
    <button className={`bottom-nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
      <span className="bottom-nav-icon">{Icons.map}</span>
      <span>Map</span>
    </button>
    <button className={`bottom-nav-item bolt ${activeTab === 'bolt' ? 'active' : ''}`} onClick={() => setActiveTab('bolt')}>
      <span className="bottom-nav-icon bolt-icon">{Icons.bolt}</span>
    </button>
    <button className={`bottom-nav-item ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>
      <span className="bottom-nav-icon">{Icons.heart}</span>
      <span>Discover</span>
    </button>
    <button className={`bottom-nav-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
      <span className="bottom-nav-icon">{Icons.calendar}</span>
      <span>Events</span>
    </button>
  </nav>
);

// ============================================
// APP VIEWS
// ============================================

const ExploreView = ({ trucks, onTruckClick }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrucks = trucks.filter(truck =>
    truck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    truck.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-view">
      <div className="explore-header">
        <h1 className="explore-title">Explore Trucks</h1>
        <div className="explore-actions">
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            {Icons.grid}
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            {Icons.menu}
          </button>
        </div>
      </div>

      <div className="explore-search">
        <span className="search-icon">{Icons.search}</span>
        <input
          type="text"
          placeholder="Search food trucks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="explore-stats">
        <span className="explore-count">{filteredTrucks.length} trucks nearby</span>
        <span className="explore-featured">{filteredTrucks.filter(t => t.featured).length} featured</span>
      </div>

      <div className={`truck-grid ${viewMode}`}>
        {filteredTrucks.map(truck => (
          <div key={truck.id} className="truck-card" onClick={() => onTruckClick(truck)}>
            <div className="truck-card-header">
              <div className="truck-emoji">{truck.image}</div>
              {truck.featured && (
                <span className="featured-badge">
                  <span className="star-icon">{Icons.star}</span>
                  Featured
                </span>
              )}
            </div>
            <div className="truck-card-body">
              <h3 className="truck-name">{truck.name}</h3>
              <p className="truck-cuisine">{truck.cuisine}</p>
              <div className="truck-meta">
                <span className="truck-rating">
                  <span className="rating-star">{Icons.star}</span>
                  {truck.rating}
                </span>
                <span className="truck-distance">
                  <span className="icon-xs">{Icons.mapPin}</span>
                  {truck.distance}
                </span>
                <span className={`truck-status ${truck.isOpen ? 'open' : 'closed'}`}>
                  {truck.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MapView = ({ trucks, onTruckClick }) => {
  const [hoveredTruck, setHoveredTruck] = useState(null);

  return (
    <div className="app-view map-view">
      <div className="map-container">
        <div className="map-background">
          <div className="map-grid"></div>

          {trucks.map((truck, index) => (
            <div
              key={truck.id}
              className={`map-marker ${truck.featured ? 'featured' : ''}`}
              style={{
                left: `${15 + (index * 14)}%`,
                top: `${20 + (index * 12)}%`
              }}
              onMouseEnter={() => setHoveredTruck(truck)}
              onMouseLeave={() => setHoveredTruck(null)}
              onClick={() => onTruckClick(truck)}
            >
              <div className="marker-pin">
                <span className="marker-emoji">{truck.image}</span>
                {truck.featured && <span className="marker-star">★</span>}
              </div>
              <div className="marker-point"></div>

              {hoveredTruck?.id === truck.id && (
                <div className="marker-popup">
                  <div className="popup-header">
                    <span className="popup-emoji">{truck.image}</span>
                    <div className="popup-info">
                      <h4>{truck.name}</h4>
                      <p>{truck.cuisine}</p>
                    </div>
                  </div>
                  <div className="popup-meta">
                    <span className="popup-rating">★ {truck.rating}</span>
                    <span className="popup-distance">{truck.distance}</span>
                    <span className={`popup-status ${truck.isOpen ? 'open' : 'closed'}`}>
                      {truck.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="map-legend">
          <h4>Legend</h4>
          <div className="legend-item">
            <div className="legend-marker featured"></div>
            <span>Featured (Pro)</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker regular"></div>
            <span>Regular Truck</span>
          </div>
        </div>

        <div className="map-info">
          <p className="map-count">{trucks.length} trucks nearby</p>
          <p className="map-hint">Hover for details, click to view</p>
        </div>
      </div>
    </div>
  );
};

const BoltView = ({ trucks, events, onTruckClick, onEventClick }) => {
  const [radius, setRadius] = useState(5);
  const [generated, setGenerated] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const randomTruck = trucks[Math.floor(Math.random() * trucks.length)];
      const shuffledItems = [...randomTruck.menuItems].sort(() => Math.random() - 0.5);
      const selectedItems = shuffledItems.slice(0, 2);
      const randomEvent = events[Math.floor(Math.random() * events.length)];

      setGenerated({
        truck: randomTruck,
        items: selectedItems,
        event: randomEvent
      });
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="app-view bolt-view">
      <div className="bolt-hero">
        <div className="bolt-icon-large">⚡</div>
        <h1>Bolt Generator</h1>
        <p>Get instant food truck recommendations powered by AI</p>
      </div>

      <div className="bolt-controls">
        <div className="radius-control">
          <label>Search Radius</label>
          <div className="radius-slider">
            <input
              type="range"
              min="1"
              max="10"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
            />
            <span className="radius-value">{radius} mi</span>
          </div>
        </div>

        <button
          className={`bolt-generate-btn ${isGenerating ? 'generating' : ''}`}
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Now ⚡'}
        </button>
      </div>

      {generated && (
        <div className="bolt-results">
          <div className="bolt-result-card truck" onClick={() => onTruckClick(generated.truck)}>
            <div className="result-label">Your Random Truck</div>
            <div className="result-truck-header">
              <span className="result-emoji">{generated.truck.image}</span>
              <div className="result-truck-info">
                <h3>{generated.truck.name}</h3>
                <p>{generated.truck.description}</p>
                <div className="result-truck-meta">
                  <span><span className="icon-xs">{Icons.mapPin}</span> {generated.truck.location}</span>
                  <span>{generated.truck.distance}</span>
                </div>
              </div>
            </div>

            <div className="result-menu">
              <div className="menu-label">Try These Items:</div>
              {generated.items.map(item => (
                <div key={item.id} className="menu-item">
                  <span className="item-emoji">{item.emoji}</span>
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-desc">{item.description}</span>
                  </div>
                  <span className="item-price">{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bolt-result-card event" onClick={() => onEventClick(generated.event)}>
            <div className="result-label">Recommended Event</div>
            <div className="result-event">
              <span className="result-emoji">{generated.event.image}</span>
              <h3>{generated.event.name}</h3>
              <p>{generated.event.description}</p>
              <div className="event-details">
                <span><span className="icon-xs">{Icons.calendar}</span> {generated.event.date}</span>
                <span><span className="icon-xs">{Icons.clock}</span> {generated.event.time}</span>
                <span><span className="icon-xs">{Icons.mapPin}</span> {generated.event.location}</span>
              </div>
            </div>
          </div>

          <button className="bolt-again-btn" onClick={handleGenerate}>
            Generate Again
          </button>
        </div>
      )}

      {!generated && (
        <div className="bolt-instructions">
          <h3>How it works:</h3>
          <ol>
            <li><span>1.</span> Set your preferred search radius</li>
            <li><span>2.</span> AI randomly selects a food truck near you</li>
            <li><span>3.</span> Get 2 random menu items to try</li>
            <li><span>4.</span> Discover a random event happening nearby</li>
            <li><span>5.</span> Visit the truck and enjoy your adventure!</li>
          </ol>
        </div>
      )}
    </div>
  );
};

const DiscoverView = ({ trucks, favorites, toggleFavorite }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const currentTruck = trucks[currentIndex];

  const handleSwipe = (direction) => {
    setSwipeDirection(direction);

    setTimeout(() => {
      if (direction === 'right') {
        toggleFavorite(currentTruck.id);
      }
      setSwipeDirection(null);
      setCurrentIndex((prev) => (prev + 1) % trucks.length);
    }, 300);
  };

  if (!currentTruck) return null;

  return (
    <div className="app-view discover-view">
      <div className={`discover-card ${swipeDirection || ''}`}>
        <div className="discover-card-content">
          <div className="discover-emoji-container">
            <span className="discover-emoji">{currentTruck.image}</span>
            {currentTruck.featured && (
              <span className="discover-featured-badge">
                <span className="star-icon">{Icons.star}</span>
                Featured
              </span>
            )}
          </div>

          <h2 className="discover-name">{currentTruck.name}</h2>
          <p className="discover-desc">{currentTruck.description}</p>

          <div className="discover-stats">
            <span className="discover-rating">
              <span className="rating-star">{Icons.star}</span>
              {currentTruck.rating}
            </span>
            <span className="discover-price">{currentTruck.priceRange}</span>
          </div>

          <div className="discover-location">
            <span className="icon-sm">{Icons.mapPin}</span>
            <span>{currentTruck.location} • {currentTruck.distance}</span>
          </div>

          <div className="discover-tags">
            {currentTruck.features.map((feature, idx) => (
              <span key={idx} className="discover-tag">{feature}</span>
            ))}
          </div>
        </div>

        <div className="discover-actions">
          <button className="discover-btn pass" onClick={() => handleSwipe('left')}>
            <span className="discover-btn-icon">{Icons.x}</span>
            Pass
          </button>
          <button className="discover-btn like" onClick={() => handleSwipe('right')}>
            <span className="discover-btn-icon">{Icons.heartFilled}</span>
            Like
          </button>
        </div>
      </div>

      <p className="discover-progress">
        {currentIndex + 1} of {trucks.length}
      </p>
    </div>
  );
};

const EventsView = ({ events, trucks, onEventClick }) => {
  const featuredEvents = events.filter(e => e.featured);

  return (
    <div className="app-view events-view">
      <h1 className="events-title">Events</h1>

      <div className="events-section">
        <h2>Featured Events</h2>
        <div className="events-featured-grid">
          {featuredEvents.map(event => (
            <div key={event.id} className="event-card featured" onClick={() => onEventClick(event)}>
              <span className="event-emoji">{event.image}</span>
              <h3>{event.name}</h3>
              <p>{event.description}</p>
              <div className="event-meta">
                <span><span className="icon-xs">{Icons.calendar}</span> {event.date}</span>
                <span><span className="icon-xs">{Icons.clock}</span> {event.time}</span>
              </div>
              <div className="event-location">
                <span className="icon-xs">{Icons.mapPin}</span> {event.location}
              </div>
              <div className="event-stats">
                <span>{event.attendees} attending</span>
                <span>{event.trucks.length} trucks</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="events-section">
        <h2>All Events</h2>
        <div className="events-list">
          {events.map(event => (
            <div key={event.id} className="event-list-item" onClick={() => onEventClick(event)}>
              <span className="event-emoji-sm">{event.image}</span>
              <div className="event-list-info">
                <h4>{event.name}</h4>
                <p>{event.date} • {event.location}</p>
              </div>
              <span className="event-attendees">{event.attendees}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TruckDetailView = ({ truck, onBack, isFavorite, toggleFavorite }) => {
  if (!truck) return null;

  return (
    <div className="app-view truck-detail-view">
      <AppHeader
        title={truck.name}
        onBack={onBack}
        rightAction={
          <button
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={() => toggleFavorite(truck.id)}
          >
            {isFavorite ? Icons.heartFilled : Icons.heart}
          </button>
        }
      />

      <div className="truck-detail-content">
        <div className="truck-detail-hero">
          <span className="truck-detail-emoji">{truck.image}</span>
          {truck.featured && (
            <span className="truck-detail-badge">
              <span className="star-icon">{Icons.star}</span>
              Featured
            </span>
          )}
        </div>

        <div className="truck-detail-info">
          <div className="truck-detail-rating">
            <span className="rating-star">{Icons.star}</span>
            <span className="rating-value">{truck.rating}</span>
            <span className="rating-count">({truck.reviewCount} reviews)</span>
          </div>

          <p className="truck-detail-desc">{truck.description}</p>

          <div className="truck-detail-meta">
            <div className="meta-item">
              <span className="icon-sm">{Icons.mapPin}</span>
              <span>{truck.location} • {truck.distance}</span>
            </div>
            <div className="meta-item">
              <span className="icon-sm">{Icons.clock}</span>
              <span>{truck.hours}</span>
            </div>
            <div className={`meta-status ${truck.isOpen ? 'open' : 'closed'}`}>
              {truck.isOpen ? 'Open Now' : 'Closed'}
            </div>
          </div>

          <div className="truck-detail-tags">
            {truck.features.map((feature, idx) => (
              <span key={idx} className="detail-tag">{feature}</span>
            ))}
          </div>
        </div>

        <div className="truck-detail-menu">
          <h3>Menu</h3>
          <div className="menu-list">
            {truck.menuItems.map(item => (
              <div key={item.id} className="menu-card">
                <span className="menu-emoji">{item.emoji}</span>
                <div className="menu-info">
                  <h4>{item.name}</h4>
                  <p>{item.description}</p>
                </div>
                <span className="menu-price">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EventDetailView = ({ event, trucks, onBack }) => {
  if (!event) return null;

  const eventTrucks = trucks.filter(t => event.trucks.includes(t.id));

  return (
    <div className="app-view event-detail-view">
      <AppHeader title={event.name} onBack={onBack} />

      <div className="event-detail-content">
        <div className="event-detail-hero">
          <span className="event-detail-emoji">{event.image}</span>
          {event.featured && <span className="event-detail-badge">Featured Event</span>}
        </div>

        <h2 className="event-detail-title">{event.name}</h2>
        <p className="event-detail-desc">{event.description}</p>

        <div className="event-detail-info">
          <div className="info-item">
            <span className="icon-sm">{Icons.calendar}</span>
            <span>{event.date}</span>
          </div>
          <div className="info-item">
            <span className="icon-sm">{Icons.clock}</span>
            <span>{event.time}</span>
          </div>
          <div className="info-item">
            <span className="icon-sm">{Icons.mapPin}</span>
            <span>{event.location}</span>
          </div>
          <div className="info-item">
            <span className="icon-sm">{Icons.users}</span>
            <span>{event.attendees} attending</span>
          </div>
        </div>

        <div className="event-actions">
          <button className="event-btn going">Going</button>
          <button className="event-btn interested">Interested</button>
        </div>

        <div className="event-trucks">
          <h3>Participating Trucks ({eventTrucks.length})</h3>
          <div className="event-trucks-list">
            {eventTrucks.map(truck => (
              <div key={truck.id} className="event-truck-item">
                <span className="truck-emoji-sm">{truck.image}</span>
                <div className="truck-info">
                  <h4>{truck.name}</h4>
                  <p>{truck.cuisine}</p>
                </div>
                <span className="truck-rating-sm">★ {truck.rating}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// APP DEMO WRAPPER
// ============================================

const AppDemo = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [favorites, setFavorites] = useState([1, 3]); // Pre-selected favorites

  const toggleFavorite = (id) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const handleTruckClick = (truck) => {
    setSelectedTruck(truck);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleBackFromTruck = () => {
    setSelectedTruck(null);
  };

  const handleBackFromEvent = () => {
    setSelectedEvent(null);
  };

  // Render truck detail if selected
  if (selectedTruck) {
    return (
      <div className="app-demo">
        <TruckDetailView
          truck={selectedTruck}
          onBack={handleBackFromTruck}
          isFavorite={favorites.includes(selectedTruck.id)}
          toggleFavorite={toggleFavorite}
        />
      </div>
    );
  }

  // Render event detail if selected
  if (selectedEvent) {
    return (
      <div className="app-demo">
        <EventDetailView
          event={selectedEvent}
          trucks={mockTrucks}
          onBack={handleBackFromEvent}
        />
      </div>
    );
  }

  // Render main app view
  return (
    <div className="app-demo">
      <div className="app-demo-header">
        <button className="back-to-landing" onClick={onBack}>
          <span className="icon-sm">{Icons.chevronLeft}</span>
          Back to Landing
        </button>
        <span className="demo-badge">Demo Mode</span>
      </div>

      {activeTab === 'explore' && (
        <ExploreView trucks={mockTrucks} onTruckClick={handleTruckClick} />
      )}
      {activeTab === 'map' && (
        <MapView trucks={mockTrucks} onTruckClick={handleTruckClick} />
      )}
      {activeTab === 'bolt' && (
        <BoltView
          trucks={mockTrucks}
          events={mockEvents}
          onTruckClick={handleTruckClick}
          onEventClick={handleEventClick}
        />
      )}
      {activeTab === 'discover' && (
        <DiscoverView
          trucks={mockTrucks}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
      {activeTab === 'events' && (
        <EventsView
          events={mockEvents}
          trucks={mockTrucks}
          onEventClick={handleEventClick}
        />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

// ============================================
// LANDING PAGE COMPONENTS
// ============================================

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

// ============================================
// LANDING PAGE
// ============================================

const LandingPage = ({ setCurrentView }) => {
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
                <a href="#waitlist" className="btn-primary btn-lg">
                  Join the Waitlist
                  <span className="btn-icon">{Icons.arrowRight}</span>
                </a>
                <button onClick={() => setCurrentView('app')} className="btn-ghost btn-lg">
                  Try Demo
                </button>
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

// ============================================
// MAIN APP
// ============================================

const App = () => {
  const [currentView, setCurrentView] = useState('landing');

  if (currentView === 'app') {
    return <AppDemo onBack={() => setCurrentView('landing')} />;
  }

  return <LandingPage setCurrentView={setCurrentView} />;
};

export default App;

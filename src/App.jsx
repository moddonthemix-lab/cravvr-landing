import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AdminDashboard from './admin/AdminDashboard';
import Header from './components/landing/Header';
import CartDrawer, { CartButton } from './components/cart/Cart';
import Checkout from './components/cart/Checkout';
import HomePage from './components/home/HomePage';
import TruckDetailPage from './components/truck/TruckDetailPage';
import SocialPage from './pages/SocialPage';
import TabContainer from './components/app/TabContainer';
import ResponsiveApp from './components/app/ResponsiveApp';
import MapPage from './pages/MapPage';
import DiscoverPage from './pages/DiscoverPage';
import BoltPage from './pages/BoltPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute, { RequireOwner, RequireAdmin } from './components/auth/ProtectedRoute';
import { OwnerDashboardWrapper, CustomerProfileWrapper } from './components/wrappers';
import { useCart } from './contexts/CartContext';
import { useInView } from './hooks/useInView';
import { supabase } from './lib/supabase';
import { Icons } from './components/common/Icons';
import BoltView from './components/bolt/BoltView';
import DiscoverView from './components/discover/DiscoverView';
import MapView from './components/map/MapView';

// Mock Data with realistic food images
const mockTrucks = [
  {
    id: 1,
    name: "Taco Loco",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
    coverImage: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=80",
    description: "Authentic Mexican street tacos with fresh ingredients and homemade salsas",
    cuisine: "Mexican",
    location: "Downtown Portland",
    address: "123 SW Morrison St",
    distance: "0.5 mi",
    deliveryTime: "15-25 min",
    deliveryFee: "$1.99",
    rating: 4.8,
    reviewCount: 328,
    isOpen: true,
    hours: "11am - 10pm",
    priceRange: "$$",
    features: ["Vegan Options", "Gluten Free", "Family Owned"],
    tags: ["mexican", "tacos", "burritos"],
    featured: true,
    coordinates: { lat: 45.5231, lng: -122.6765 },
    menuItems: [
      { id: 1, name: "Street Tacos (3)", price: "$12.99", image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=400&q=80", description: "Corn tortillas, cilantro, onion, choice of meat" },
      { id: 2, name: "Loaded Nachos", price: "$14.99", image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=400&q=80", description: "Chips, queso, beans, guacamole, sour cream" },
      { id: 3, name: "Burrito Supreme", price: "$13.99", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=400&q=80", description: "Rice, beans, meat, cheese, all the fixings" }
    ]
  },
  {
    id: 2,
    name: "Burger Joint",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    coverImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
    description: "Smash burgers, crispy fries, and thick shakes made fresh daily",
    cuisine: "American",
    location: "Pearl District",
    address: "456 NW 10th Ave",
    distance: "1.2 mi",
    deliveryTime: "20-30 min",
    deliveryFee: "$2.49",
    rating: 4.6,
    reviewCount: 195,
    isOpen: true,
    hours: "10am - 9pm",
    priceRange: "$$$",
    features: ["Outdoor Seating", "Late Night", "Craft Beer"],
    tags: ["american", "burgers", "fries"],
    featured: false,
    coordinates: { lat: 45.5295, lng: -122.6819 },
    menuItems: [
      { id: 1, name: "Classic Smash", price: "$14.99", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80", description: "Double patty, American cheese, special sauce" },
      { id: 2, name: "Truffle Fries", price: "$8.99", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80", description: "Hand-cut, truffle oil, parmesan" },
      { id: 3, name: "Bacon BBQ Burger", price: "$16.99", image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=400&q=80", description: "Bacon, cheddar, BBQ sauce, onion rings" }
    ]
  },
  {
    id: 3,
    name: "Thai Street",
    image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80",
    coverImage: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&w=1200&q=80",
    description: "Authentic Thai cuisine from Bangkok street food recipes",
    cuisine: "Thai",
    location: "Southeast Portland",
    address: "789 SE Division St",
    distance: "2.1 mi",
    deliveryTime: "25-40 min",
    deliveryFee: "$2.99",
    rating: 4.9,
    reviewCount: 456,
    isOpen: false,
    hours: "12pm - 8pm",
    priceRange: "$$",
    features: ["Vegan Options", "Dairy Free", "Spicy"],
    tags: ["thai", "asian", "noodles"],
    featured: true,
    coordinates: { lat: 45.5089, lng: -122.6359 },
    menuItems: [
      { id: 1, name: "Pad Thai", price: "$13.99", image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=400&q=80", description: "Rice noodles, shrimp, peanuts, lime" },
      { id: 2, name: "Green Curry", price: "$14.99", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400&q=80", description: "Coconut curry, vegetables, jasmine rice" },
      { id: 3, name: "Tom Yum Soup", price: "$11.99", image: "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=400&q=80", description: "Spicy and sour, shrimp, mushrooms" }
    ]
  },
  {
    id: 4,
    name: "Slice Mobile",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    coverImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80",
    description: "Wood-fired artisan pizza with imported Italian ingredients",
    cuisine: "Italian",
    location: "Northwest Portland",
    address: "321 NW 23rd Ave",
    distance: "1.8 mi",
    deliveryTime: "20-35 min",
    deliveryFee: "$2.49",
    rating: 4.7,
    reviewCount: 312,
    isOpen: true,
    hours: "11am - 11pm",
    priceRange: "$$",
    features: ["Wood-Fired", "Vegan Options", "Gluten Free Crust"],
    tags: ["pizza", "italian", "pasta"],
    featured: true,
    coordinates: { lat: 45.5370, lng: -122.7042 },
    menuItems: [
      { id: 1, name: "Margherita", price: "$16.99", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80", description: "San Marzano tomatoes, fresh mozzarella, basil" },
      { id: 2, name: "Pepperoni", price: "$18.99", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80", description: "Cup & char pepperoni, mozzarella, red sauce" },
      { id: 3, name: "Truffle Mushroom", price: "$19.99", image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=400&q=80", description: "Wild mushrooms, truffle oil, fontina" }
    ]
  },
  {
    id: 5,
    name: "Morning Brew",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    coverImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    description: "Specialty coffee, fresh pastries, and breakfast sandwiches",
    cuisine: "Coffee & Breakfast",
    location: "Downtown Portland",
    address: "555 SW 5th Ave",
    distance: "0.3 mi",
    deliveryTime: "10-20 min",
    deliveryFee: "$0.99",
    rating: 4.5,
    reviewCount: 187,
    isOpen: true,
    hours: "6am - 2pm",
    priceRange: "$",
    features: ["Oat Milk", "Vegan Pastries", "Organic"],
    tags: ["coffee", "breakfast", "bakery"],
    featured: false,
    coordinates: { lat: 45.5202, lng: -122.6742 },
    menuItems: [
      { id: 1, name: "Latte", price: "$5.49", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80", description: "Double shot espresso, steamed milk" },
      { id: 2, name: "Avocado Toast", price: "$9.99", image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=400&q=80", description: "Sourdough, smashed avo, everything seasoning" },
      { id: 3, name: "Breakfast Burrito", price: "$11.99", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=400&q=80", description: "Eggs, bacon, cheese, potatoes, salsa" }
    ]
  },
  {
    id: 6,
    name: "Catch of the Day",
    image: "https://images.unsplash.com/photo-1579631542720-3a87824fff86?auto=format&fit=crop&w=800&q=80",
    coverImage: "https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?auto=format&fit=crop&w=1200&q=80",
    description: "Fresh Pacific seafood, lobster rolls, and clam chowder",
    cuisine: "Seafood",
    location: "Waterfront",
    address: "888 SW Naito Pkwy",
    distance: "3.2 mi",
    deliveryTime: "30-45 min",
    deliveryFee: "$3.99",
    rating: 4.9,
    reviewCount: 267,
    isOpen: false,
    hours: "12pm - 9pm",
    priceRange: "$$$",
    features: ["Sustainable", "Gluten Free Options", "Local Catch"],
    tags: ["seafood", "fish", "lobster"],
    featured: true,
    coordinates: { lat: 45.5155, lng: -122.6719 },
    menuItems: [
      { id: 1, name: "Fish & Chips", price: "$16.99", image: "https://images.unsplash.com/photo-1579631542720-3a87824fff86?auto=format&fit=crop&w=400&q=80", description: "Beer-battered cod, hand-cut fries, tartar" },
      { id: 2, name: "Lobster Roll", price: "$24.99", image: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=400&q=80", description: "Maine lobster, buttered roll, coleslaw" },
      { id: 3, name: "Clam Chowder", price: "$9.99", image: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=400&q=80", description: "New England style, served in a bread bowl" }
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
    address: "Pioneer Courthouse Square, Portland",
    description: "Weekly gathering of Portland's best food trucks with live music",
    attendees: 345,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    coverImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    featured: true,
    trucks: [1, 2, 4],
    coordinates: { lat: 45.5189, lng: -122.6783 }
  },
  {
    id: 2,
    name: "Taste of Portland Festival",
    date: "Jan 22, 2025",
    time: "12:00 PM - 8:00 PM",
    location: "Waterfront Park",
    address: "Tom McCall Waterfront Park",
    description: "Annual food truck festival featuring 20+ local favorites, craft beer garden, and live entertainment",
    attendees: 1230,
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
    coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    featured: true,
    trucks: [1, 2, 3, 4, 5, 6],
    coordinates: { lat: 45.5165, lng: -122.6725 }
  },
  {
    id: 3,
    name: "Late Night Bites",
    date: "Jan 18, 2025",
    time: "8:00 PM - 12:00 AM",
    location: "Downtown Food Pod",
    address: "SW 9th & Alder, Portland",
    description: "After-hours food truck meetup for night owls and late-night cravings",
    attendees: 167,
    image: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80",
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    featured: false,
    trucks: [2, 4],
    coordinates: { lat: 45.5195, lng: -122.6798 }
  },
  {
    id: 4,
    name: "Brunch & Bites",
    date: "Jan 19, 2025",
    time: "10:00 AM - 2:00 PM",
    location: "Alberta Arts District",
    address: "NE Alberta St, Portland",
    description: "Weekend brunch featuring breakfast trucks, bottomless mimosas, and acoustic music",
    attendees: 289,
    image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80",
    coverImage: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80",
    featured: false,
    trucks: [5, 1],
    coordinates: { lat: 45.5590, lng: -122.6476 }
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

// ============================================
// SHARED COMPONENTS
// ============================================
// Note: Header component is now imported from ./components/landing/Header

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

const AppDemoShell = ({ children, activeTab, setActiveTab, onBack }) => (
  <div className="app-demo">
    <div className="app-demo-header">
      <button className="back-to-landing" onClick={onBack}>
        <span className="icon-sm">{Icons.chevronLeft}</span>
        <span>Exit Demo</span>
      </button>
      <div className="demo-branding">
        <span className="demo-logo">{Icons.truck}</span>
        <span className="demo-title">Cravrr</span>
      </div>
      <span className="demo-badge">
        <span className="demo-badge-dot"></span>
        Demo
      </span>
    </div>
    <div className="app-demo-content">
      {children}
    </div>
    <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
  </div>
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

const ExploreView = ({ trucks, onTruckClick, favorites, toggleFavorite }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const cuisineFilters = ['all', 'Mexican', 'American', 'Thai', 'Italian', 'Coffee', 'Seafood'];

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      truck.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || truck.cuisine === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const featuredTrucks = filteredTrucks.filter(t => t.featured);
  const regularTrucks = filteredTrucks.filter(t => !t.featured);

  return (
    <div className="app-view explore-view-new">
      {/* Hero Search Section */}
      <div className="explore-hero">
        <div className="explore-hero-content">
          <h1 className="explore-hero-title">
            What are you <span className="gradient-text">craving</span>?
          </h1>
          <p className="explore-hero-subtitle">Discover {trucks.length} amazing food trucks near you</p>
        </div>
        <div className="explore-search-wrapper">
          <div className="explore-search-box">
            <span className="search-icon">{Icons.search}</span>
            <input
              type="text"
              placeholder="Search trucks, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-filter-btn">
              {Icons.filter}
            </button>
          </div>
        </div>
      </div>

      {/* Cuisine Filters */}
      <div className="explore-filters">
        <div className="filter-scroll">
          {cuisineFilters.map(filter => (
            <button
              key={filter}
              className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'all' ? 'All Trucks' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Section */}
      {featuredTrucks.length > 0 && (
        <div className="explore-section">
          <div className="section-header-row">
            <div className="section-label">
              <span className="section-icon featured-icon">{Icons.star}</span>
              <h2>Featured</h2>
            </div>
            <span className="section-count">{featuredTrucks.length} trucks</span>
          </div>
          <div className="featured-trucks-scroll">
            {featuredTrucks.map((truck, index) => (
              <div
                key={truck.id}
                className="featured-truck-card-img"
                onClick={() => onTruckClick(truck)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="featured-card-image">
                  <img src={truck.coverImage || truck.image} alt={truck.name} />
                  <div className="featured-card-overlay">
                    <button
                      className={`card-fav-btn ${favorites.includes(truck.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(truck.id); }}
                    >
                      {favorites.includes(truck.id) ? Icons.heartFilled : Icons.heart}
                    </button>
                    <span className="featured-badge-pill">
                      {Icons.star} Featured
                    </span>
                  </div>
                  {truck.deliveryTime && (
                    <div className="delivery-time-badge">
                      {truck.deliveryTime}
                    </div>
                  )}
                </div>
                <div className="featured-card-body">
                  <div className="featured-card-title-row">
                    <h3>{truck.name}</h3>
                    <span className="rating-badge">
                      {Icons.star} {truck.rating}
                    </span>
                  </div>
                  <p className="featured-card-meta-text">
                    {truck.cuisine} • {truck.priceRange} • {truck.distance}
                  </p>
                  <div className="featured-card-bottom">
                    <span className="delivery-fee">
                      {truck.deliveryFee ? `${truck.deliveryFee} Delivery` : 'Free Delivery'}
                    </span>
                    <div className={`status-pill ${truck.isOpen ? 'open' : 'closed'}`}>
                      <span className="status-dot"></span>
                      {truck.isOpen ? 'Open' : 'Closed'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Trucks Grid */}
      <div className="explore-section">
        <div className="section-header-row">
          <div className="section-label">
            <span className="section-icon">{Icons.compass}</span>
            <h2>Nearby</h2>
          </div>
          <span className="section-count">{regularTrucks.length} trucks</span>
        </div>
        <div className="trucks-grid-img">
          {regularTrucks.map((truck, index) => (
            <div
              key={truck.id}
              className="truck-card-img"
              onClick={() => onTruckClick(truck)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="truck-card-image-wrapper">
                <img src={truck.image} alt={truck.name} className="truck-card-image" />
                <button
                  className={`card-fav-btn ${favorites.includes(truck.id) ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(truck.id); }}
                >
                  {favorites.includes(truck.id) ? Icons.heartFilled : Icons.heart}
                </button>
                {truck.deliveryTime && (
                  <div className="delivery-time-badge small">
                    {truck.deliveryTime}
                  </div>
                )}
              </div>
              <div className="truck-card-info">
                <div className="truck-card-header">
                  <h3>{truck.name}</h3>
                  <span className="rating-pill">
                    {Icons.star} {truck.rating}
                  </span>
                </div>
                <p className="truck-card-cuisine">{truck.cuisine} • {truck.priceRange}</p>
                <div className="truck-card-meta">
                  <span className="delivery-info">
                    {truck.deliveryFee || 'Free'} • {truck.distance}
                  </span>
                  <div className={`status-dot-small ${truck.isOpen ? 'open' : 'closed'}`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// MapView, BoltView, and DiscoverView removed - now using standalone components from src/components/

const EventsView = ({ events, trucks, onEventClick }) => {
  const featuredEvents = events.filter(e => e.featured);
  const upcomingEvents = events.filter(e => !e.featured);

  return (
    <div className="app-view events-view-new">
      {/* Hero Header */}
      <div className="events-hero">
        <div className="events-hero-content">
          <h1>Upcoming <span className="gradient-text">Events</span></h1>
          <p>Food truck gatherings, festivals & more</p>
        </div>
        <div className="events-quick-stats">
          <div className="quick-stat">
            <span className="stat-number">{events.length}</span>
            <span className="stat-label">Events</span>
          </div>
          <div className="quick-stat">
            <span className="stat-number">{events.reduce((acc, e) => acc + e.trucks.length, 0)}</span>
            <span className="stat-label">Trucks</span>
          </div>
        </div>
      </div>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <div className="events-section-new">
          <div className="section-header-new">
            <div className="section-title-row">
              <span className="section-icon-badge featured">{Icons.star}</span>
              <h2>Featured Events</h2>
            </div>
          </div>
          <div className="featured-events-scroll">
            {featuredEvents.map((event, index) => (
              <div
                key={event.id}
                className="featured-event-card-img"
                onClick={() => onEventClick(event)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="featured-event-image">
                  <img src={event.image} alt={event.name} />
                  <div className="event-image-overlay"></div>
                  <div className="event-badge-pill">Featured</div>
                  <div className="event-date-badge">
                    <span className="date-day">{event.date.split(' ')[1]?.replace(',', '') || '15'}</span>
                    <span className="date-month">{event.date.split(' ')[0] || 'Jan'}</span>
                  </div>
                </div>
                <div className="featured-event-body">
                  <h3>{event.name}</h3>
                  <p className="event-desc-text">{event.description}</p>
                  <div className="event-info-row">
                    <div className="info-chip">
                      <span className="info-icon">{Icons.clock}</span>
                      <span>{event.time}</span>
                    </div>
                    <div className="info-chip">
                      <span className="info-icon">{Icons.mapPin}</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <div className="event-bottom-row">
                    <div className="attendees-info">
                      <span className="attendees-icon">{Icons.users}</span>
                      <span>{event.attendees} attending</span>
                    </div>
                    <div className="truck-avatars-img">
                      {event.trucks.slice(0, 3).map(truckId => {
                        const truck = trucks.find(t => t.id === truckId);
                        return truck ? (
                          <div key={truckId} className="truck-avatar-img">
                            <img src={truck.image} alt={truck.name} />
                          </div>
                        ) : null;
                      })}
                      {event.trucks.length > 3 && (
                        <span className="truck-avatar-more">+{event.trucks.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events List */}
      <div className="events-section-new">
        <div className="section-header-new">
          <div className="section-title-row">
            <span className="section-icon-badge">{Icons.calendar}</span>
            <h2>All Events</h2>
          </div>
          <span className="section-count">{events.length} events</span>
        </div>
        <div className="events-list-img">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="event-list-card-img"
              onClick={() => onEventClick(event)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="event-list-image">
                <img src={event.image} alt={event.name} />
                {event.featured && <span className="list-featured-badge">Featured</span>}
              </div>
              <div className="event-list-content">
                <div className="event-list-header">
                  <h4>{event.name}</h4>
                  <span className="event-list-date">{event.date}</span>
                </div>
                <div className="event-list-info">
                  <span className="info-pill">
                    {Icons.clock} {event.time}
                  </span>
                  <span className="info-pill">
                    {Icons.mapPin} {event.location}
                  </span>
                </div>
                <div className="event-list-footer">
                  <span className="attendees-pill">
                    {Icons.users} {event.attendees} going
                  </span>
                  <span className="trucks-pill">{event.trucks.length} trucks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TruckDetailView = ({ truck, onBack, isFavorite, toggleFavorite }) => {
  const { addItem, openCart, itemCount } = useCart();
  const [addedItem, setAddedItem] = useState(null);

  const handleAddToCart = (item) => {
    // Convert mock item to cart-compatible format
    const cartItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price.replace('$', '')),
      emoji: item.emoji || '🍽️',
    };

    const truckData = {
      id: truck.id,
      name: truck.name,
    };

    const success = addItem(cartItem, truckData);
    if (success) {
      setAddedItem(item.id);
      setTimeout(() => setAddedItem(null), 1500);
    }
  };

  if (!truck) return null;

  return (
    <div className="app-view truck-detail-view-img">
      {/* Sticky Header */}
      <div className="detail-header-img">
        <button className="detail-back-btn" onClick={onBack}>
          {Icons.chevronLeft}
        </button>
        <div className="detail-header-title">
          <span>{truck.name}</span>
        </div>
        <button
          className={`detail-fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={() => toggleFavorite(truck.id)}
        >
          {isFavorite ? Icons.heartFilled : Icons.heart}
        </button>
      </div>

      {/* Hero Image Section */}
      <div className="truck-detail-hero-img">
        <img src={truck.coverImage || truck.image} alt={truck.name} className="hero-cover-image" />
        <div className="hero-image-overlay"></div>
        {truck.featured && (
          <div className="hero-featured-badge">
            <span>{Icons.star}</span>
            Featured
          </div>
        )}
        <div className="hero-delivery-badge">
          <span>{truck.deliveryTime || '15-25 min'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="truck-detail-body">
        {/* Title Section */}
        <div className="detail-title-section">
          <div className="title-row">
            <h1>{truck.name}</h1>
            <div className="rating-pill">
              <span className="star">{Icons.star}</span>
              <span className="rating-num">{truck.rating}</span>
              <span className="review-text">({truck.reviewCount})</span>
            </div>
          </div>
          <p className="detail-cuisine">{truck.cuisine} • {truck.priceRange}</p>
          <p className="detail-description">{truck.description}</p>
        </div>

        {/* Quick Info Cards */}
        <div className="quick-info-grid">
          <div className="quick-info-card">
            <span className="info-icon">{Icons.mapPin}</span>
            <div className="info-text">
              <span className="info-label">Location</span>
              <span className="info-value">{truck.location}</span>
            </div>
          </div>
          <div className="quick-info-card">
            <span className="info-icon">{Icons.clock}</span>
            <div className="info-text">
              <span className="info-label">Hours</span>
              <span className="info-value">{truck.hours}</span>
            </div>
          </div>
          <div className="quick-info-card distance">
            <span className="info-icon">{Icons.target}</span>
            <div className="info-text">
              <span className="info-label">Distance</span>
              <span className="info-value">{truck.distance}</span>
            </div>
          </div>
          <div className={`quick-info-card status ${truck.isOpen ? 'open' : 'closed'}`}>
            <span className="status-indicator">
              <span className="status-dot"></span>
            </span>
            <div className="info-text">
              <span className="info-label">Status</span>
              <span className="info-value">{truck.isOpen ? 'Open Now' : 'Closed'}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="detail-section">
          <h3>Features & Dietary</h3>
          <div className="features-grid">
            {truck.features.map((feature, idx) => (
              <span key={idx} className="feature-tag">
                <span className="feature-check">{Icons.check}</span>
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Menu Section */}
        <div className="detail-section menu-section-img">
          <div className="section-header">
            <h3>Menu Highlights</h3>
            <span className="menu-count">{truck.menuItems.length} items</span>
          </div>
          <div className="menu-grid-img">
            {truck.menuItems.map(item => (
              <div key={item.id} className="menu-item-card-img">
                <div className="menu-item-image">
                  <img src={item.image} alt={item.name} />
                  {item.popular && <span className="popular-badge">Popular</span>}
                </div>
                <div className="menu-item-details">
                  <div className="menu-item-header">
                    <h4>{item.name}</h4>
                    <span className="menu-item-price">{item.price}</span>
                  </div>
                  <p className="menu-item-desc">{item.description}</p>
                  <button
                    className={`add-to-cart-btn ${addedItem === item.id ? 'added' : ''}`}
                    onClick={() => handleAddToCart(item)}
                  >
                    {addedItem === item.id ? (
                      <>
                        Added!
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </>
                    ) : (
                      <>
                        Add to Order
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="detail-cta">
          <button className="cta-directions">
            {Icons.mapPin}
            Get Directions
          </button>
          <button className="cta-share">
            {Icons.megaphone}
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

const EventDetailView = ({ event, trucks, onBack, onTruckClick }) => {
  if (!event) return null;

  const eventTrucks = trucks.filter(t => event.trucks.includes(t.id));
  const [isGoing, setIsGoing] = useState(false);

  return (
    <div className="app-view event-detail-view-new">
      {/* Header */}
      <div className="detail-header-new">
        <button className="detail-back-btn" onClick={onBack}>
          {Icons.chevronLeft}
        </button>
        <div className="detail-header-title">
          <span className="header-emoji">{event.image}</span>
          <span>Event Details</span>
        </div>
        <button className="detail-share-btn">
          {Icons.megaphone}
        </button>
      </div>

      {/* Hero */}
      <div className="event-detail-hero-new">
        <div className="event-hero-bg">
          <div className="hero-glow-1"></div>
          <div className="hero-glow-2"></div>
        </div>
        <div className="event-hero-content">
          <span className="event-hero-emoji">{event.image}</span>
          {event.featured && (
            <div className="event-hero-badge">
              <span>{Icons.star}</span>
              Featured Event
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="event-detail-body">
        {/* Title */}
        <div className="event-title-section">
          <h1>{event.name}</h1>
          <p className="event-description">{event.description}</p>
        </div>

        {/* Info Cards */}
        <div className="event-info-cards">
          <div className="info-card">
            <span className="info-card-icon">{Icons.calendar}</span>
            <div className="info-card-content">
              <span className="info-label">Date</span>
              <span className="info-value">{event.date}</span>
            </div>
          </div>
          <div className="info-card">
            <span className="info-card-icon">{Icons.clock}</span>
            <div className="info-card-content">
              <span className="info-label">Time</span>
              <span className="info-value">{event.time}</span>
            </div>
          </div>
          <div className="info-card full">
            <span className="info-card-icon">{Icons.mapPin}</span>
            <div className="info-card-content">
              <span className="info-label">Location</span>
              <span className="info-value">{event.location}</span>
            </div>
          </div>
        </div>

        {/* Attendees */}
        <div className="attendees-section">
          <div className="attendees-header">
            <span className="attendees-icon">{Icons.users}</span>
            <div className="attendees-info">
              <span className="attendees-count">{event.attendees}</span>
              <span className="attendees-label">people going</span>
            </div>
          </div>
          <div className="attendees-avatars">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="avatar-circle" style={{ animationDelay: `${i * 50}ms` }}>
                {['👤', '👨', '👩', '🧑', '👱'][i]}
              </div>
            ))}
            <span className="more-avatars">+{event.attendees - 5}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="event-action-buttons">
          <button
            className={`action-button going ${isGoing ? 'active' : ''}`}
            onClick={() => setIsGoing(!isGoing)}
          >
            <span className="btn-icon">{isGoing ? Icons.check : Icons.calendar}</span>
            {isGoing ? "I'm Going!" : 'Mark as Going'}
          </button>
          <button className="action-button directions">
            <span className="btn-icon">{Icons.mapPin}</span>
            Get Directions
          </button>
        </div>

        {/* Trucks Section */}
        <div className="event-trucks-section">
          <div className="section-header">
            <h3>Participating Trucks</h3>
            <span className="trucks-count">{eventTrucks.length} trucks</span>
          </div>
          <div className="event-trucks-grid">
            {eventTrucks.map((truck, index) => (
              <div
                key={truck.id}
                className="event-truck-card"
                onClick={() => onTruckClick && onTruckClick(truck)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="truck-card-header">
                  <span className="truck-emoji">{truck.image}</span>
                  <div className="truck-rating-badge">
                    <span className="star">{Icons.star}</span>
                    {truck.rating}
                  </div>
                </div>
                <div className="truck-card-body">
                  <h4>{truck.name}</h4>
                  <p>{truck.cuisine}</p>
                  <div className={`truck-status-mini ${truck.isOpen ? 'open' : 'closed'}`}>
                    <span className="status-dot"></span>
                    {truck.isOpen ? 'Open' : 'Closed'}
                  </div>
                </div>
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
  const [showCheckout, setShowCheckout] = useState(false);
  const { openCart, closeCart, itemCount } = useCart();

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

  const handleCheckout = () => {
    closeCart();
    setShowCheckout(true);
  };

  const handleCheckoutBack = () => {
    setShowCheckout(false);
  };

  const handleOrderComplete = () => {
    setShowCheckout(false);
  };

  // Render checkout if active
  if (showCheckout) {
    return (
      <div className="app-demo">
        <Checkout
          onBack={handleCheckoutBack}
          onOrderComplete={handleOrderComplete}
        />
      </div>
    );
  }

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
          onTruckClick={handleTruckClick}
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
          <span>Exit Demo</span>
        </button>
        <div className="demo-branding">
          <span className="demo-logo">{Icons.truck}</span>
          <span className="demo-title">Cravrr</span>
        </div>
        <span className="demo-badge">
          <span className="demo-badge-dot"></span>
          Demo
        </span>
      </div>

      <div className="app-demo-content">
        {activeTab === 'explore' && (
          <ExploreView
            trucks={mockTrucks}
            onTruckClick={handleTruckClick}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        )}
        {activeTab === 'map' && (
          <MapView
            trucks={mockTrucks}
            loading={false}
            onTruckClick={handleTruckClick}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        )}
        {activeTab === 'bolt' && (
          <BoltView
            trucks={mockTrucks}
            loading={false}
            onTruckClick={handleTruckClick}
          />
        )}
        {activeTab === 'discover' && (
          <DiscoverView
            trucks={mockTrucks}
            loading={false}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onTruckClick={handleTruckClick}
          />
        )}
        {activeTab === 'events' && (
          <EventsView
            events={mockEvents}
            trucks={mockTrucks}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Cart Components */}
      <CartButton onClick={openCart} />
      <CartDrawer onCheckout={handleCheckout} />
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
// LANDING PAGE
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
      const { error } = await supabase
        .from('waitlist')
        .insert([
          {
            name: waitlistName,
            email: waitlistEmail,
            type: waitlistType,
            status: 'pending'
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - email already exists
          setWaitlistError('This email is already on the waitlist!');
        } else {
          setWaitlistError('Something went wrong. Please try again.');
          console.error('Waitlist error:', error);
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

// ============================================
// WRAPPER COMPONENTS FOR ROUTING
// ============================================

// Wrapper for LandingPage with navigate
const LandingPageWrapper = () => {
  const navigate = useNavigate();

  const setCurrentView = (view) => {
    switch (view) {
      case 'home':
        navigate('/');
        break;
      case 'app':
        navigate('/browse');
        break;
      case 'owner-dashboard':
        navigate('/owner');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/eat');
    }
  };

  return <LandingPage setCurrentView={setCurrentView} />;
};

// Wrapper for AppDemo with navigate
const AppDemoWrapper = () => {
  const navigate = useNavigate();
  return <AppDemo onBack={() => navigate('/')} />;
};

// ============================================
// MAIN APP
// ============================================

const App = () => {
  return (
    <>
      <CartDrawer />
      <Routes>
        {/* Main app - responsive: TabContainer on mobile, HomePage on desktop */}
        <Route path="/" element={<ResponsiveApp />} />

        {/* Landing/Marketing page at /eat */}
        <Route path="/eat" element={<LandingPageWrapper />} />

        {/* Standalone login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Browse trucks - redirect to home */}
        <Route path="/browse" element={<Navigate to="/" replace />} />

        {/* Feature pages with sidebar (desktop) */}
        <Route path="/map" element={<MapPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/bolt" element={<BoltPage />} />

        {/* Truck detail page - production version */}
        <Route path="/truck/:id" element={<TruckDetailPage />} />

        {/* User profile - requires authentication */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <CustomerProfileWrapper />
          </ProtectedRoute>
        } />
        {/* Redirect legacy profile tab routes */}
        <Route path="/orders" element={<Navigate to="/profile?tab=orders" replace />} />
        <Route path="/favorites" element={<Navigate to="/profile?tab=favorites" replace />} />

        {/* Owner dashboard - requires owner role */}
        <Route path="/owner" element={
          <RequireOwner>
            <OwnerDashboardWrapper />
          </RequireOwner>
        } />

        {/* Admin dashboard - requires admin role */}
        <Route path="/admin" element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        } />

        {/* Social media graphics studio */}
        <Route path="/social" element={<SocialPage />} />

        {/* Fallback to home */}
        <Route path="*" element={<ResponsiveApp />} />
      </Routes>
    </>
  );
};

export default App;

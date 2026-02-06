// Mock Data for the Cravvr app demo

export const mockTrucks = [
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
    prepTime: "15-25 min",
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
    prepTime: "20-30 min",
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
    prepTime: "25-40 min",
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
    prepTime: "20-35 min",
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
    prepTime: "10-20 min",
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
    prepTime: "30-45 min",
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

export const mockEvents = [
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

export const categories = [
  { label: 'Pizza', icon: '🍕' },
  { label: 'Burgers', icon: '🍔' },
  { label: 'Tacos', icon: '🌮' },
  { label: 'BBQ', icon: '🍖' },
  { label: 'Breakfast', icon: '🍳' }
];

export const cards = [
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
    offer: 'Free pickup',
    promoted: true,
    liked: true,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80'
  }
];

export const faqs = [
  {
    q: 'How is Cravrr different from other food apps?',
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

export const testimonials = [
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

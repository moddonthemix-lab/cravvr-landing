// Mock data for trucks
export const mockTrucks = [
  {
    id: 1,
    name: "Taco Paradise",
    image: "🌮",
    description: "Authentic Mexican street tacos",
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
    description: "Gourmet burgers and fries",
    cuisine: "American",
    location: "Pearl District",
    distance: "1.2 mi",
    rating: 4.6,
    reviewCount: 95,
    isOpen: true,
    hours: "10am - 9pm",
    priceRange: "$$$",
    features: ["Outdoor Seating", "Open 24/7"],
    tags: ["american", "open24"],
    menuItems: [
      { id: 1, name: "Burrito Bowl", price: "$11", emoji: "🥗", description: "Rice, beans, protein, and toppings" },
      { id: 2, name: "Street Tacos", price: "$9", emoji: "🌮", description: "Three authentic street tacos" },
      { id: 3, name: "Quesadilla", price: "$10", emoji: "🧀", description: "Melted cheese and your choice of protein" }
    ]
  },
  {
    id: 3,
    name: "Thai Street Food",
    image: "🍜",
    description: "Authentic Thai cuisine",
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
    menuItems: [
      { id: 1, name: "Margherita Pizza", price: "$16", emoji: "🍕", description: "Fresh mozzarella, basil, tomato" },
      { id: 2, name: "Pepperoni Pizza", price: "$18", emoji: "🍕", description: "Classic pepperoni with cheese" },
      { id: 3, name: "Vegan Pizza", price: "$17", emoji: "🥬", description: "Plant-based cheese and veggies" }
    ]
  },
  {
    id: 5,
    name: "Coffee Cart",
    image: "☕",
    description: "Specialty coffee and pastries",
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
    menuItems: [
      { id: 1, name: "Latte", price: "$5", emoji: "☕", description: "Espresso with steamed milk" },
      { id: 2, name: "Croissant", price: "$4", emoji: "🥐", description: "Buttery, flaky pastry" },
      { id: 3, name: "Avocado Toast", price: "$8", emoji: "🥑", description: "Smashed avocado on sourdough" }
    ]
  },
  {
    id: 6,
    name: "Boba Bliss",
    image: "🧋",
    description: "Bubble tea and Asian snacks",
    cuisine: "Boba",
    location: "Pearl District",
    distance: "1.5 mi",
    rating: 4.4,
    reviewCount: 73,
    isOpen: true,
    hours: "11am - 9pm",
    priceRange: "$",
    features: ["Dairy Free Options"],
    tags: ["boba", "snacks", "dairyFree"],
    menuItems: [
      { id: 1, name: "Classic Milk Tea", price: "$6", emoji: "🧋", description: "Black tea with milk and tapioca" },
      { id: 2, name: "Taro Smoothie", price: "$7", emoji: "💜", description: "Creamy taro with boba" },
      { id: 3, name: "Fruit Tea", price: "$6", emoji: "🍓", description: "Refreshing fruit-infused tea" }
    ]
  },
  {
    id: 7,
    name: "Dim Sum Delight",
    image: "🥟",
    description: "Traditional Chinese dumplings",
    cuisine: "Chinese",
    location: "Chinatown",
    distance: "2.5 mi",
    rating: 4.8,
    reviewCount: 134,
    isOpen: true,
    hours: "10am - 8pm",
    priceRange: "$$",
    features: ["Halal"],
    tags: ["chinese", "halal"],
    menuItems: [
      { id: 1, name: "Pork Dumplings", price: "$10", emoji: "🥟", description: "Steamed pork-filled dumplings" },
      { id: 2, name: "Spring Rolls", price: "$8", emoji: "🥢", description: "Crispy vegetable rolls" },
      { id: 3, name: "Fried Rice", price: "$9", emoji: "🍚", description: "Wok-fried rice with vegetables" }
    ]
  },
  {
    id: 8,
    name: "Sea Shack",
    image: "🦞",
    description: "Fresh seafood dishes",
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
    menuItems: [
      { id: 1, name: "Fish & Chips", price: "$15", emoji: "🐟", description: "Beer-battered cod with fries" },
      { id: 2, name: "Clam Chowder", price: "$12", emoji: "🥣", description: "Creamy New England style" },
      { id: 3, name: "Lobster Roll", price: "$22", emoji: "🦞", description: "Maine lobster on a toasted bun" }
    ]
  }
];

// Mock events data
export const mockEvents = [
  {
    id: 1,
    name: "Food Truck Friday",
    date: "Nov 15, 2024",
    time: "5:00 PM - 9:00 PM",
    location: "Pioneer Square",
    description: "Weekly gathering of the best food trucks in Portland",
    attendees: 45,
    image: "🎉",
    featured: true
  },
  {
    id: 2,
    name: "Taste of Portland",
    date: "Nov 22, 2024",
    time: "12:00 PM - 8:00 PM",
    location: "Waterfront Park",
    description: "Annual food truck festival featuring local favorites",
    attendees: 230,
    image: "🍴",
    featured: true
  },
  {
    id: 3,
    name: "Late Night Bites",
    date: "Nov 18, 2024",
    time: "8:00 PM - 12:00 AM",
    location: "Downtown Food Pod",
    description: "After-hours food truck meetup",
    attendees: 67,
    image: "🌙",
    featured: false
  }
];

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://coqwihsmmigktqqdnmis.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcXdpaHNtbWlna3RxcWRubWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTg1NTMsImV4cCI6MjA4MjYzNDU1M30.ybwwLZguj58PGzCuM-gCdMoUjGHLh2zmkZihy6_zEx8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const demoTrucks = [
  {
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    description: 'Authentic street tacos and Mexican favorites made fresh daily',
    phone: '(555) 123-4567',
    location: 'Downtown Food Court',
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    rating: 4.8,
    status: 'open'
  },
  {
    name: 'Burger Haven',
    cuisine: 'American',
    description: 'Gourmet burgers with locally sourced ingredients',
    phone: '(555) 234-5678',
    location: 'City Park',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    rating: 4.6,
    status: 'open'
  },
  {
    name: 'Thai Street Eats',
    cuisine: 'Thai',
    description: 'Traditional Thai street food with bold flavors',
    phone: '(555) 345-6789',
    location: 'University District',
    image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800',
    rating: 4.9,
    status: 'open'
  },
  {
    name: 'Pizza Paradise',
    cuisine: 'Italian',
    description: 'Wood-fired Neapolitan pizza on the go',
    phone: '(555) 456-7890',
    location: 'Market Square',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    rating: 4.7,
    status: 'open'
  },
  {
    name: 'Morning Brew Coffee',
    cuisine: 'Coffee',
    description: 'Specialty coffee and fresh pastries',
    phone: '(555) 567-8901',
    location: 'Business District',
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    rating: 4.5,
    status: 'open'
  }
];

const menusByTruck = {
  'Taco Fiesta': [
    { name: 'Street Tacos', description: 'Three tacos with choice of meat', price: 8.99, category: 'Tacos', available: true },
    { name: 'Burrito Bowl', description: 'Rice, beans, meat, and toppings', price: 10.99, category: 'Bowls', available: true },
    { name: 'Quesadilla', description: 'Cheese and meat in a grilled tortilla', price: 7.99, category: 'Appetizers', available: true },
    { name: 'Chips & Guacamole', description: 'Fresh made guacamole with tortilla chips', price: 6.99, category: 'Appetizers', available: true },
    { name: 'Horchata', description: 'Traditional rice drink', price: 3.99, category: 'Beverages', available: true }
  ],
  'Burger Haven': [
    { name: 'Classic Cheeseburger', description: 'Beef patty, cheese, lettuce, tomato', price: 11.99, category: 'Burgers', available: true },
    { name: 'Bacon BBQ Burger', description: 'With bacon and BBQ sauce', price: 13.99, category: 'Burgers', available: true },
    { name: 'Veggie Burger', description: 'House-made veggie patty', price: 10.99, category: 'Burgers', available: true },
    { name: 'French Fries', description: 'Crispy golden fries', price: 4.99, category: 'Sides', available: true },
    { name: 'Milkshake', description: 'Chocolate, vanilla, or strawberry', price: 5.99, category: 'Beverages', available: true }
  ],
  'Thai Street Eats': [
    { name: 'Pad Thai', description: 'Classic rice noodles with peanuts', price: 12.99, category: 'Noodles', available: true },
    { name: 'Green Curry', description: 'Coconut curry with vegetables', price: 11.99, category: 'Curry', available: true },
    { name: 'Spring Rolls', description: 'Fresh vegetable spring rolls', price: 6.99, category: 'Appetizers', available: true },
    { name: 'Mango Sticky Rice', description: 'Sweet sticky rice with fresh mango', price: 7.99, category: 'Desserts', available: true },
    { name: 'Thai Iced Tea', description: 'Sweet and creamy Thai tea', price: 4.99, category: 'Beverages', available: true }
  ],
  'Pizza Paradise': [
    { name: 'Margherita Pizza', description: 'Fresh mozzarella, basil, tomato', price: 14.99, category: 'Pizza', available: true },
    { name: 'Pepperoni Pizza', description: 'Classic pepperoni and cheese', price: 15.99, category: 'Pizza', available: true },
    { name: 'Veggie Supreme', description: 'Loaded with fresh vegetables', price: 16.99, category: 'Pizza', available: true },
    { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons', price: 7.99, category: 'Salads', available: true },
    { name: 'Tiramisu', description: 'Italian coffee-flavored dessert', price: 6.99, category: 'Desserts', available: true }
  ],
  'Morning Brew Coffee': [
    { name: 'Espresso', description: 'Double shot espresso', price: 3.99, category: 'Coffee', available: true },
    { name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 5.99, category: 'Coffee', available: true },
    { name: 'Cold Brew', description: 'Smooth cold-brewed coffee', price: 4.99, category: 'Coffee', available: true },
    { name: 'Croissant', description: 'Buttery flaky croissant', price: 4.99, category: 'Pastries', available: true },
    { name: 'Avocado Toast', description: 'Smashed avocado on sourdough', price: 8.99, category: 'Food', available: true }
  ]
};

async function addDemoData() {
  console.log('Starting to add demo data...\n');

  for (const truck of demoTrucks) {
    console.log(`Adding truck: ${truck.name}...`);

    // Insert the truck
    const { data: truckData, error: truckError } = await supabase
      .from('food_trucks')
      .insert(truck)
      .select()
      .single();

    if (truckError) {
      console.error(`Error adding ${truck.name}:`, truckError);
      continue;
    }

    console.log(`✓ Added truck: ${truck.name} (ID: ${truckData.id})`);

    // Add menu items for this truck
    const menuItems = menusByTruck[truck.name];
    if (menuItems) {
      const menuItemsWithTruckId = menuItems.map(item => ({
        ...item,
        truck_id: truckData.id
      }));

      const { error: menuError } = await supabase
        .from('menu_items')
        .insert(menuItemsWithTruckId);

      if (menuError) {
        console.error(`Error adding menu items for ${truck.name}:`, menuError);
      } else {
        console.log(`✓ Added ${menuItems.length} menu items for ${truck.name}\n`);
      }
    }
  }

  console.log('\n✅ Demo data added successfully!');
  console.log(`Total trucks added: ${demoTrucks.length}`);
  process.exit(0);
}

addDemoData().catch(error => {
  console.error('Error adding demo data:', error);
  process.exit(1);
});

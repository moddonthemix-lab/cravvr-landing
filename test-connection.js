// Quick Supabase connection test
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://coqwihsmmigktgqdnmis.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7VpR41Naa_w7yp8v_SK-_A_vELGCMML';

console.log('🔍 Testing Supabase connection...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test 1: Connection
console.log('Test 1: Connection');
try {
  const { data, error } = await supabase.from('food_trucks').select('count');
  if (error) {
    console.log('❌ Connection failed:', error.message);
  } else {
    console.log('✅ Connection successful!\n');
  }
} catch (err) {
  console.log('❌ Error:', err.message, '\n');
}

// Test 2: Check tables
console.log('Test 2: Checking tables...');
const tables = ['profiles', 'customers', 'owners', 'food_trucks', 'events', 'reviews', 'favorites', 'check_ins'];

for (const table of tables) {
  try {
    const { error } = await supabase.from(table).select('*').limit(1);
    console.log(error ? `❌ ${table}` : `✅ ${table}`);
  } catch (err) {
    console.log(`❌ ${table} - ${err.message}`);
  }
}

// Test 3: Query data
console.log('\nTest 3: Querying food_trucks table...');
const { data, error } = await supabase.from('food_trucks').select('*');
if (error) {
  console.log('❌ Query failed:', error.message);
} else {
  console.log(`✅ Query successful! Found ${data.length} food trucks.`);
  if (data.length === 0) {
    console.log('   (Database is empty - this is normal for a new setup)');
  }
}

console.log('\n🎉 All tests complete!');
process.exit(0);

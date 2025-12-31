# Supabase Database Migrations

This folder contains SQL migration scripts for the Cravvr database.

## How to Run Migrations

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of the migration file
5. Paste and click **Run**

## Migration Files

| File | Description | Status |
|------|-------------|--------|
| `001_add_orders.sql` | Adds orders and order_items tables with RLS | Pending |
| `002_auto_profile_trigger.sql` | Auto-creates profile on user signup | Pending |

## Initial Setup

If setting up a fresh database, run the full schema first:
- `../supabase-schema.sql` - Complete database schema

## Migration History

### 001_add_orders.sql
**Added:** 2024-12-29

Adds e-commerce order functionality:
- `orders` table - Customer orders with status tracking
- `order_items` table - Individual items in each order
- Auto-generated order numbers (format: `ORD-YYYYMMDD-XXXX`)
- RLS policies for customers and truck owners

**Tables created:**
- `orders` - Main order records
- `order_items` - Line items for each order

**Run this if:** You already have the base schema and need to add ordering functionality.

### 002_auto_profile_trigger.sql
**Added:** 2024-12-31

Automatically creates a profile when users sign up:
- Creates a trigger on `auth.users` table
- Inserts record into `profiles` table with user metadata
- Creates corresponding `customers` or `owners` record based on role

**Run this if:** You want automatic profile creation on signup (required for auth to work properly).

---

## Creating New Migrations

When adding new database changes:

1. Create a new file with the next number: `002_description.sql`
2. Use `IF NOT EXISTS` and `DROP ... IF EXISTS` for idempotency
3. Include RLS policies if adding new tables
4. Update this README with the migration details

### Template for new migrations:

```sql
-- ============================================
-- MIGRATION: [Description]
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CREATE TABLES
CREATE TABLE IF NOT EXISTS your_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- columns here
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_your_table_column ON your_table(column);

-- 3. ENABLE RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES
DROP POLICY IF EXISTS "Policy name" ON your_table;
CREATE POLICY "Policy name" ON your_table FOR SELECT USING (true);
```

## Troubleshooting

### "relation already exists"
The migration was already run. This is safe to ignore if using `IF NOT EXISTS`.

### "permission denied"
Check that RLS policies are correctly configured for your user role.

### "violates foreign key constraint"
Ensure referenced tables exist before running the migration.

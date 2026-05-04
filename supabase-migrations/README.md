# Supabase Database Migrations

This folder contains SQL migration scripts for the Cravvr database.

## How to Run Migrations

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of the migration file
5. Paste and click **Run**

## Migration Files

| File | Description |
|------|-------------|
| `001_add_orders.sql` | orders / order_items tables with RLS |
| `002_auto_profile_trigger.sql` | auto-create profile on signup |
| `003_add_admin_role.sql` | admin role support on profiles |
| `004_add_waitlist.sql` | waitlist table |
| `005_add_addresses_and_payments.sql` | saved addresses + payment methods |
| `006_email_logs.sql` | email send log |
| `007_add_menu_item_image_url.sql` | image_url on menu_items |
| `008_create_truck_ratings_view.sql` | aggregated ratings view |
| `009_add_admin_order_policies.sql` | admin RLS policies on orders |
| `010_postgis.sql` | enable PostGIS, geography columns, distance fns |
| `011_user_creation_trigger.sql` | user creation trigger updates |
| `012_sendgrid_confirmation_setup.sql` | SendGrid confirmation hook |
| `013_owner_settings.sql` | owner-side configuration table |
| `014_prep_time.sql` | menu item prep time fields |
| `015_order_throttling.sql` | per-truck order throttling |
| `016_order_state_machine.sql` | formal order state transitions |
| `017_rewards_points.sql` | loyalty points + redemption |
| `018_stripe_connect.sql` | Stripe Connect payout config |
| `019_fix_favorites.sql` | hotfix for favorites schema |
| `020_fix_customers_fk.sql` | hotfix for customers FK |

> ⚠️ **Ordering caveat for 010–020:** these files were previously loose at the
> repo root and have been renumbered into a best-guess foundational → features →
> hotfixes order. If you're running these on a fresh DB, verify each file's
> assumptions before running the next. If your prod DB already has these
> applied, the numbering is purely organizational.

Dev-only SQL utilities (not migrations) live in `scripts/sql/`.

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

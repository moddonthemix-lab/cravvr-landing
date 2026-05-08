-- 042_fix_order_items_fk.sql
-- Resolve the contradictory FK on order_items.menu_item_id.
--
-- 001_add_orders.sql declared the column `NOT NULL REFERENCES menu_items(id)
-- ON DELETE SET NULL`. The two clauses contradict: if a menu_item is ever
-- deleted, ON DELETE SET NULL would write NULL into a NOT NULL column,
-- raising a constraint violation. Owners couldn't delete menu items that had
-- ever been ordered.
--
-- order_items already snapshots the line item (`name`, `price`, `quantity`,
-- `special_instructions`) onto each row, so a NULL `menu_item_id` is fine
-- for receipts and history — the back-link to the live menu item just
-- becomes "this item no longer exists in the menu," which is true.
--
-- Idempotent.

ALTER TABLE order_items
  ALTER COLUMN menu_item_id DROP NOT NULL;

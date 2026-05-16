-- Add Square Catalog object id to menu_items so the one-shot import in
-- square-oauth-callback can upsert by (truck_id, square_catalog_object_id)
-- without colliding with manually-created Cravvr-only items (which have NULL).

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS square_catalog_object_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS menu_items_truck_square_obj_idx
  ON public.menu_items(truck_id, square_catalog_object_id)
  WHERE square_catalog_object_id IS NOT NULL;

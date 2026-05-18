-- Fix sync_food_truck_geom trigger.
--
-- Two problems:
--   1. The function called ST_MakePoint / ST_SetSRID without qualifying the
--      schema. PostGIS lives in `extensions` on Supabase, and the function
--      doesn't set search_path, so the calls failed with
--      "function st_makepoint(double precision, double precision) does not exist"
--      on every UPDATE — blocking owner edits, soft-deletes, and admin updates
--      to any truck row that had `coordinates` set.
--   2. The trigger fires on every UPDATE, even when coordinates didn't change,
--      so unrelated updates were paying for a geom recompute (and hitting bug #1).
--
-- Fix: schema-qualify the PostGIS calls (so we don't depend on search_path),
-- and skip the recompute when coordinates is unchanged.

CREATE OR REPLACE FUNCTION public.sync_food_truck_geom()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.coordinates IS NOT DISTINCT FROM OLD.coordinates THEN
    RETURN NEW;
  END IF;

  IF NEW.coordinates IS NOT NULL
     AND NEW.coordinates->>'lat' IS NOT NULL
     AND NEW.coordinates->>'lng' IS NOT NULL THEN
    NEW.geom := extensions.ST_SetSRID(
      extensions.ST_MakePoint(
        (NEW.coordinates->>'lng')::float,
        (NEW.coordinates->>'lat')::float
      ),
      4326
    );
  ELSE
    NEW.geom := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

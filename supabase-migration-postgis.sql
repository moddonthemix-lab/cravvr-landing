-- Migration: PostGIS Geospatial for food_trucks
-- Run this in Supabase SQL Editor

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add geometry column
ALTER TABLE food_trucks ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

-- 3. Populate geom from existing coordinates JSONB
UPDATE food_trucks
SET geom = ST_SetSRID(
  ST_MakePoint(
    (coordinates->>'lng')::float,
    (coordinates->>'lat')::float
  ),
  4326
)
WHERE coordinates IS NOT NULL
  AND coordinates->>'lat' IS NOT NULL
  AND coordinates->>'lng' IS NOT NULL
  AND geom IS NULL;

-- 4. Also populate from latitude/longitude columns if they exist
UPDATE food_trucks
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE geom IS NULL
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL;

-- 5. Create spatial index
CREATE INDEX IF NOT EXISTS idx_food_trucks_geom ON food_trucks USING GIST (geom);

-- 6. Create trigger to auto-sync coordinates → geom on insert/update
CREATE OR REPLACE FUNCTION sync_food_truck_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.coordinates IS NOT NULL
     AND NEW.coordinates->>'lat' IS NOT NULL
     AND NEW.coordinates->>'lng' IS NOT NULL THEN
    NEW.geom := ST_SetSRID(
      ST_MakePoint(
        (NEW.coordinates->>'lng')::float,
        (NEW.coordinates->>'lat')::float
      ),
      4326
    );
  ELSIF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_food_truck_geom ON food_trucks;
CREATE TRIGGER trg_sync_food_truck_geom
  BEFORE INSERT OR UPDATE ON food_trucks
  FOR EACH ROW EXECUTE FUNCTION sync_food_truck_geom();

-- 7. RPC to find nearby trucks within radius
CREATE OR REPLACE FUNCTION find_nearby_trucks(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_miles DOUBLE PRECISION DEFAULT 10
)
RETURNS SETOF food_trucks
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM food_trucks
  WHERE geom IS NOT NULL
    AND ST_DWithin(
      geom::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_miles * 1609.34  -- convert miles to meters
    )
  ORDER BY geom::geography <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
$$;

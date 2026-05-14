import React, { useState, useEffect, useRef } from 'react';
import { Map, Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Icons } from '../common/Icons';
import { useTrucks } from '../../contexts/TruckContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const MAP_STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`
  : 'https://demotiles.maplibre.org/style.json';

// Generate truck positions around center using spiral pattern
const getTruckPositions = (center, count) => {
  if (count === 0) return [];
  const positions = [];
  const baseRadius = 0.008;
  const positionsPerRing = 6;

  for (let i = 0; i < count; i++) {
    const ring = Math.floor(i / positionsPerRing);
    const positionInRing = i % positionsPerRing;
    const radius = baseRadius * (1 + ring * 0.5);
    const angleStep = (2 * Math.PI) / positionsPerRing;
    const angle = positionInRing * angleStep + (ring * 0.5);

    positions.push([
      center[0] + radius * Math.cos(angle),
      center[1] + radius * Math.sin(angle) * 1.3,
    ]);
  }

  return positions;
};

// ============================================
// MARKER COMPONENTS
// ============================================

const TruckMarker = ({ truck }) => (
  <div
    className={cn(
      'relative h-[50px] w-[50px] overflow-hidden rounded-full border-[3px] bg-white shadow-lg transition-transform hover:scale-110 cursor-pointer',
      truck.featured
        ? 'border-warning'
        : truck.isOpen
          ? 'border-primary'
          : 'border-muted-foreground/40 grayscale'
    )}
  >
    <img src={truck.image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
    {truck.featured && (
      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[10px] leading-none text-warning-foreground shadow">
        ★
      </span>
    )}
  </div>
);

const UserLocationDot = () => (
  <div className="relative flex h-6 w-6 items-center justify-center">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
    <span className="relative inline-flex h-4 w-4 rounded-full bg-primary border-2 border-white shadow" />
  </div>
);

// ============================================
// SUB-COMPONENTS
// ============================================

const TruckListCard = ({ truck, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`View ${truck.name}, ${truck.cuisine}, ${truck.isOpen ? 'Open now' : 'Closed'}`}
    className="group flex w-full gap-3.5 rounded-2xl border border-border/60 bg-card p-3 text-left transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-muted">
      <img src={truck.image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
      {truck.featured && (
        <span className="absolute top-1 left-1 rounded-md bg-warning/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-warning-foreground">
          Featured
        </span>
      )}
    </div>
    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm leading-tight truncate capitalize">{truck.name}</h3>
        <span
          className={cn(
            'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold',
            truck.isOpen
              ? 'bg-positive/15 text-positive'
              : 'bg-destructive/10 text-destructive'
          )}
        >
          {truck.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
      <p className="text-xs text-muted-foreground truncate">
        {truck.cuisine} <span className="text-border mx-0.5">·</span> {truck.priceRange}
      </p>
      <div className="flex items-center gap-3 mt-0.5">
        <span className="inline-flex items-center gap-1 text-xs font-semibold">
          <span className="h-3 w-3 text-warning">{Icons.star}</span>
          {truck.rating}
        </span>
        {truck.location && truck.location !== 'Portland, OR' && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate">
            <span className="h-3 w-3 shrink-0">{Icons.mapPin}</span>
            {truck.location.split(',')[0]}
          </span>
        )}
      </div>
    </div>
  </button>
);

const MobileTruckList = ({ trucks, onTruckClick, onClose }) => (
  <div
    role="dialog"
    aria-label="Food truck list"
    aria-modal="true"
    className="absolute inset-0 z-[1001] flex flex-col bg-background"
  >
    <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4">
      <h2 id="truck-list-title" className="text-lg font-bold tracking-tight">
        {trucks.length} Food Trucks
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close truck list"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
      >
        <span className="h-4 w-4">{Icons.x}</span>
      </button>
    </div>
    <div
      role="list"
      aria-labelledby="truck-list-title"
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
    >
      {trucks.map((truck) => (
        <TruckListCard
          key={truck.id}
          truck={truck}
          onClick={() => {
            onTruckClick(truck);
            onClose();
          }}
        />
      ))}
    </div>
  </div>
);

const DesktopTruckList = ({ trucks, onTruckClick }) => (
  <aside
    aria-label="Nearby food trucks"
    className="hidden xl:flex flex-col bg-card border-l border-border overflow-hidden"
    style={{ gridColumn: 2, gridRow: 2 }}
  >
    <div className="border-b border-border px-6 py-5">
      <h2 id="desktop-truck-list-title" className="text-lg font-bold tracking-tight">
        {trucks.length} Food Trucks Nearby
      </h2>
      <p className="text-sm text-muted-foreground mt-0.5">Click a truck to view details</p>
    </div>
    <div
      role="list"
      aria-labelledby="desktop-truck-list-title"
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
    >
      {trucks.map((truck) => (
        <TruckListCard
          key={truck.id}
          truck={truck}
          onClick={() => onTruckClick(truck)}
        />
      ))}
    </div>
  </aside>
);

// Location prompt (inc. loading state)
const LocationPrompt = ({ status, onEnable, onSkip }) => {
  const isLoading = status === 'loading';
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-white to-muted/40 px-5 min-h-[60vh]">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="flex flex-col items-center text-center py-10 px-6 space-y-4">
          {isLoading ? (
            <>
              <div
                className="h-12 w-12 rounded-full border-[3px] border-muted border-t-primary animate-spin"
                role="status"
                aria-label="Finding your location"
              />
              <h2 className="text-2xl font-bold tracking-tight">Finding your location…</h2>
              <p className="text-sm text-muted-foreground">This may take a moment.</p>
            </>
          ) : (
            <>
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
                <span className="h-9 w-9">{Icons.mapPin}</span>
              </span>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight">Find Food Trucks Near You</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enable location to see nearby food trucks on the map.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
                <Button size="lg" onClick={onEnable} className="flex-1 gap-2">
                  <span className="h-4 w-4">{Icons.mapPin}</span>
                  Enable Location
                </Button>
                <Button size="lg" variant="outline" onClick={onSkip} className="flex-1">
                  Use Portland, OR
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================
// MAIN MAP VIEW COMPONENT
// ============================================

const MapView = ({ trucks, loading, onTruckClick, favorites, toggleFavorite }) => {
  const [showList, setShowList] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('prompt');
  const [isLargeDesktop, setIsLargeDesktop] = useState(window.innerWidth >= 1200);
  const [geocodedTrucks, setGeocodedTrucks] = useState({});
  const [activeTruck, setActiveTruck] = useState(null);
  const { loadNearbyTrucks } = useTrucks();
  const [spatialTrucks, setSpatialTrucks] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsLargeDesktop(window.innerWidth >= 1200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const geocodeMissing = async () => {
      for (const truck of trucks) {
        if (!truck.lat && !truck.lng && truck.location && !geocodedTrucks[truck.id]) {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(truck.location)}&format=json&limit=1`
            );
            const results = await response.json();
            if (results.length > 0) {
              setGeocodedTrucks(prev => ({
                ...prev,
                [truck.id]: { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) },
              }));
            }
          } catch (err) {
            console.error(`Failed to geocode truck ${truck.name}:`, err);
          }
        }
      }
    };
    if (trucks.length > 0) geocodeMissing();
  }, [trucks]);

  useEffect(() => {
    if (userLocation && loadNearbyTrucks) {
      loadNearbyTrucks(userLocation[0], userLocation[1], 15).then(result => {
        if (result && result.length > 0) setSpatialTrucks(result);
      });
    }
  }, [userLocation, loadNearbyTrucks]);

  const displayTrucks = spatialTrucks || trucks;

  const defaultCenter = [45.5152, -122.6784];
  const mapCenter = userLocation || defaultCenter;
  const truckPositions = getTruckPositions(mapCenter, displayTrucks.length);

  const getTruckPosition = (truck, index) => {
    if (truck.lat && truck.lng) return [truck.lat, truck.lng];
    const geo = geocodedTrucks[truck.id];
    if (geo) return [geo.lat, geo.lng];
    return truckPositions[index] || mapCenter;
  };

  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({ center: [userLocation[1], userLocation[0]], zoom: 14, duration: 1200 });
    }
  }, [userLocation]);

  const requestLocation = () => {
    setLocationStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationStatus('granted');
        },
        () => setLocationStatus('denied'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationStatus('denied');
    }
  };

  const skipLocation = () => setLocationStatus('denied');

  // Show location prompt or loading state
  if (locationStatus === 'prompt' || locationStatus === 'loading') {
    return (
      <div className="flex flex-col h-[calc(100vh-65px)] min-h-[400px] bg-muted/40">
        <LocationPrompt
          status={locationStatus}
          onEnable={requestLocation}
          onSkip={skipLocation}
        />
      </div>
    );
  }

  const activeTruckIndex = activeTruck ? displayTrucks.findIndex(t => t.id === activeTruck.id) : -1;
  const activeTruckPos = activeTruck && activeTruckIndex >= 0
    ? getTruckPosition(activeTruck, activeTruckIndex)
    : null;

  return (
    <div
      className={cn(
        'flex flex-col bg-muted/40',
        'h-[calc(100vh-65px)] min-h-[400px]',
        'xl:grid xl:grid-cols-[1fr_420px] xl:grid-rows-[auto_1fr]'
      )}
    >
      {/* Map Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4 sm:px-8 sm:py-5 xl:col-span-full">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
          <span aria-hidden="true" className="h-5 w-5 text-primary sm:h-6 sm:w-6">
            {Icons.mapPin}
          </span>
          <span>Food Trucks Near You</span>
        </h1>
        <button
          type="button"
          onClick={() => setShowList(!showList)}
          aria-expanded={showList}
          aria-controls="mobile-truck-list"
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/70 xl:hidden"
        >
          <span aria-hidden="true" className="h-4 w-4">
            {showList ? Icons.mapPin : Icons.list}
          </span>
          {showList ? 'Map' : 'List'}
        </button>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 xl:col-start-1 xl:row-start-2">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: mapCenter[1], latitude: mapCenter[0], zoom: 14 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          attributionControl={{ compact: true }}
        >
          {userLocation && (
            <Marker longitude={userLocation[1]} latitude={userLocation[0]} anchor="center">
              <UserLocationDot />
            </Marker>
          )}

          {displayTrucks.map((truck, index) => {
            const [lat, lng] = getTruckPosition(truck, index);
            return (
              <Marker
                key={truck.id}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setActiveTruck(truck);
                }}
              >
                <TruckMarker truck={truck} />
              </Marker>
            );
          })}

          {activeTruck && activeTruckPos && (
            <Popup
              longitude={activeTruckPos[1]}
              latitude={activeTruckPos[0]}
              anchor="bottom"
              offset={56}
              onClose={() => setActiveTruck(null)}
              closeButton={false}
              maxWidth="320px"
            >
              <div
                onClick={() => onTruckClick(activeTruck)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onTruckClick(activeTruck);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${activeTruck.name}`}
                className="cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus-visible:rounded-lg w-[260px]"
              >
                <div className="relative h-24 sm:h-32 overflow-hidden">
                  <img
                    src={activeTruck.image}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                  />
                  {activeTruck.featured && (
                    <span className="absolute top-2 left-2 rounded-md bg-warning px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-foreground">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-3 sm:p-4 space-y-2">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base leading-tight">{activeTruck.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {activeTruck.cuisine} • {activeTruck.priceRange}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold">
                      <span className="h-3.5 w-3.5 text-warning">{Icons.star}</span>
                      {activeTruck.rating}
                    </span>
                    <span className="text-xs text-muted-foreground">{activeTruck.distance}</span>
                  </div>
                  <span
                    className={cn(
                      'inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                      activeTruck.isOpen
                        ? 'bg-positive/15 text-positive'
                        : 'bg-destructive/10 text-destructive'
                    )}
                  >
                    {activeTruck.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Map Legend */}
        <div
          aria-label="Map legend"
          className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-2 rounded-xl bg-white p-3 shadow-md sm:bottom-6 sm:left-6 sm:p-4 sm:gap-2.5"
        >
          {[
            { color: 'border-warning bg-white', label: 'Featured' },
            { color: 'border-primary bg-white', label: 'Open' },
            { color: 'border-primary bg-primary', label: 'You' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-foreground/80">
              <span
                aria-hidden="true"
                className={cn('h-3 w-3 rounded-full border-2', item.color)}
              />
              {item.label}
            </div>
          ))}
        </div>

        {/* Recenter Button */}
        <div className="absolute right-3 top-3 z-[1000] sm:right-6 sm:top-6">
          <button
            type="button"
            onClick={requestLocation}
            aria-label="Center map on your location"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-foreground shadow-md transition-all hover:bg-muted hover:shadow-lg sm:h-13 sm:w-13"
          >
            <span className="h-5 w-5">{Icons.target}</span>
          </button>
        </div>
      </div>

      {/* List Overlay (mobile/tablet) */}
      {showList && !isLargeDesktop && (
        <MobileTruckList
          trucks={displayTrucks}
          onTruckClick={onTruckClick}
          onClose={() => setShowList(false)}
        />
      )}

      {/* Desktop Sidebar List (always visible at xl+) */}
      {isLargeDesktop && (
        <DesktopTruckList trucks={displayTrucks} onTruckClick={onTruckClick} />
      )}
    </div>
  );
};

export default MapView;

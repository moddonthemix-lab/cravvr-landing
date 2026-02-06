import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icons } from '../common/Icons';
import './MapView.css';

// Map controller to handle view updates
const MapController = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);

  return null;
};

// Generate truck positions around center using spiral pattern
// Handles any number of trucks without stacking at center
const getTruckPositions = (center, count) => {
  if (count === 0) return [];

  const positions = [];
  const baseRadius = 0.008; // ~800m at equator
  const positionsPerRing = 6;

  for (let i = 0; i < count; i++) {
    // Spiral outward: increase radius every ring
    const ring = Math.floor(i / positionsPerRing);
    const positionInRing = i % positionsPerRing;
    const radius = baseRadius * (1 + ring * 0.5);
    const angleStep = (2 * Math.PI) / positionsPerRing;
    const angle = positionInRing * angleStep + (ring * 0.5); // Offset each ring

    positions.push([
      center[0] + radius * Math.cos(angle),
      center[1] + radius * Math.sin(angle) * 1.3, // Adjust for lat/lng ratio
    ]);
  }

  return positions;
};

// ============================================
// SUB-COMPONENTS
// ============================================

// Shared truck card component with accessibility
const TruckListCard = ({ truck, onClick, variant = 'mobile' }) => {
  return (
    <button
      type="button"
      className="truck-list-card"
      onClick={onClick}
      aria-label={`View ${truck.name}, ${truck.cuisine}, ${truck.isOpen ? 'Open now' : 'Closed'}`}
    >
      <div className="tlc-image">
        <img src={truck.image} alt="" aria-hidden="true" />
        {truck.featured && <span className="tlc-featured">Featured</span>}
      </div>
      <div className="tlc-body">
        <div className="tlc-top">
          <h3 className="tlc-name">{truck.name}</h3>
          <span className={`tlc-status ${truck.isOpen ? 'open' : 'closed'}`}>
            {truck.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="tlc-cuisine">{truck.cuisine} <span className="tlc-dot">&middot;</span> {truck.priceRange}</p>
        <div className="tlc-bottom">
          <span className="tlc-rating">{Icons.star} {truck.rating}</span>
          {truck.location && truck.location !== 'Portland, OR' && (
            <span className="tlc-location">{Icons.mapPin || '📍'} {truck.location.split(',')[0]}</span>
          )}
        </div>
      </div>
    </button>
  );
};

// Mobile list overlay component
const MobileTruckList = ({ trucks, onTruckClick, onClose }) => (
  <div
    className="map-list-overlay-leaflet"
    role="dialog"
    aria-label="Food truck list"
    aria-modal="true"
  >
    <div className="map-list-header">
      <h2 id="truck-list-title">{trucks.length} Food Trucks</h2>
      <button
        type="button"
        className="close-list-btn"
        onClick={onClose}
        aria-label="Close truck list"
      >
        {Icons.x}
      </button>
    </div>
    <div className="map-list-content" role="list" aria-labelledby="truck-list-title">
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

// Desktop sidebar list component
const DesktopTruckList = ({ trucks, onTruckClick }) => (
  <aside className="map-desktop-list" aria-label="Nearby food trucks">
    <div className="desktop-list-header">
      <h2 id="desktop-truck-list-title">{trucks.length} Food Trucks Nearby</h2>
      <p>Click a truck to view details</p>
    </div>
    <div className="desktop-list-content" role="list" aria-labelledby="desktop-truck-list-title">
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

// Location prompt component
const LocationPrompt = ({ status, onEnable, onSkip }) => {
  if (status === 'loading') {
    return (
      <div className="map-view-leaflet">
        <div className="location-prompt">
          <div className="location-prompt-content">
            <div className="location-loading">
              <div
                className="loading-spinner"
                role="status"
                aria-label="Finding your location"
              />
            </div>
            <h2>Finding your location...</h2>
            <p>This may take a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view-leaflet">
      <div className="location-prompt">
        <div className="location-prompt-content">
          <div className="location-icon-wrapper">
            <span className="location-icon" aria-hidden="true">{Icons.mapPin}</span>
          </div>
          <h2>Find Food Trucks Near You</h2>
          <p>Enable location to see nearby food trucks on the map.</p>
          <div className="location-buttons">
            <button
              type="button"
              className="location-btn primary"
              onClick={onEnable}
            >
              Enable Location
            </button>
            <button
              type="button"
              className="location-btn secondary"
              onClick={onSkip}
            >
              Use Portland, OR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN MAP VIEW COMPONENT
// ============================================

const MapView = ({ trucks, loading, onTruckClick, favorites, toggleFavorite }) => {
  const [showList, setShowList] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('prompt'); // 'prompt', 'loading', 'granted', 'denied'
  const [isLargeDesktop, setIsLargeDesktop] = useState(window.innerWidth >= 1200);
  const [geocodedTrucks, setGeocodedTrucks] = useState({});

  // Listen for resize to toggle desktop mode
  useEffect(() => {
    const handleResize = () => {
      setIsLargeDesktop(window.innerWidth >= 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Geocode trucks that have a location text but no coordinates
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

  // Merge geocoded positions into trucks for marker placement
  const getTruckPosition = (truck, index) => {
    if (truck.lat && truck.lng) return [truck.lat, truck.lng];
    const geo = geocodedTrucks[truck.id];
    if (geo) return [geo.lat, geo.lng];
    return truckPositions[index] || mapCenter;
  };

  // Default to Portland
  const defaultCenter = [45.5152, -122.6784];
  const mapCenter = userLocation || defaultCenter;
  const truckPositions = getTruckPositions(mapCenter, trucks.length);

  const requestLocation = () => {
    setLocationStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationStatus('granted');
        },
        () => {
          setLocationStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationStatus('denied');
    }
  };

  const skipLocation = () => {
    setLocationStatus('denied');
  };

  // Create custom truck marker icon
  const createTruckIcon = (truck) => {
    return L.divIcon({
      className: 'custom-truck-marker',
      html: `
        <div class="leaflet-marker-content ${truck.featured ? 'featured' : ''} ${truck.isOpen ? 'open' : 'closed'}">
          <img src="${truck.image}" alt="${truck.name}" class="marker-img" />
          ${truck.featured ? '<span class="marker-star">★</span>' : ''}
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
    });
  };

  // User location icon
  const userLocationIcon = L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Handle popup click with keyboard support
  const handlePopupClick = (truck, event) => {
    // Allow Enter and Space keys as well as clicks
    if (event.type === 'click' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTruckClick(truck);
    }
  };

  // Show location prompt if needed
  if (locationStatus === 'prompt' || locationStatus === 'loading') {
    return (
      <LocationPrompt
        status={locationStatus}
        onEnable={requestLocation}
        onSkip={skipLocation}
      />
    );
  }

  return (
    <div className="map-view-leaflet">
      {/* Map Header */}
      <div className="map-header-leaflet">
        <h1>
          <span aria-hidden="true">{Icons.mapPin}</span>
          <span>Food Trucks Near You</span>
        </h1>
        <button
          type="button"
          className="map-list-toggle"
          onClick={() => setShowList(!showList)}
          aria-expanded={showList}
          aria-controls="mobile-truck-list"
        >
          <span aria-hidden="true">{showList ? Icons.mapPin : Icons.list}</span>
          <span>{showList ? 'Map' : 'List'}</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="leaflet-map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          scrollWheelZoom={true}
        >
          <MapController center={mapCenter} />
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>
                <span>You are here</span>
              </Popup>
            </Marker>
          )}

          {/* Truck Markers */}
          {trucks.map((truck, index) => (
            <Marker
              key={truck.id}
              position={getTruckPosition(truck, index)}
              icon={createTruckIcon(truck)}
            >
              <Popup>
                <div
                  className="popup-content"
                  onClick={(e) => handlePopupClick(truck, e)}
                  onKeyDown={(e) => handlePopupClick(truck, e)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${truck.name}`}
                >
                  <div className="popup-image">
                    <img src={truck.image} alt="" aria-hidden="true" />
                    {truck.featured && <span className="popup-featured">Featured</span>}
                  </div>
                  <div className="popup-info">
                    <h4>{truck.name}</h4>
                    <p className="popup-cuisine">{truck.cuisine} • {truck.priceRange}</p>
                    <div className="popup-meta">
                      <span className="popup-rating">{Icons.star} {truck.rating}</span>
                      <span className="popup-distance">{truck.distance}</span>
                    </div>
                    <span className={`popup-status ${truck.isOpen ? 'open' : 'closed'}`}>
                      {truck.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Legend */}
        <div className="map-legend-leaflet" aria-label="Map legend">
          <div className="legend-item">
            <span className="legend-marker featured" aria-hidden="true"></span>
            <span>Featured</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker regular" aria-hidden="true"></span>
            <span>Open</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker user" aria-hidden="true"></span>
            <span>You</span>
          </div>
        </div>

        {/* Recenter Button */}
        <div className="map-controls-leaflet">
          <button
            type="button"
            className="map-control-btn"
            onClick={requestLocation}
            aria-label="Center map on your location"
          >
            {Icons.target}
          </button>
        </div>
      </div>

      {/* List Overlay (mobile/tablet) */}
      {showList && !isLargeDesktop && (
        <MobileTruckList
          trucks={trucks}
          onTruckClick={onTruckClick}
          onClose={() => setShowList(false)}
        />
      )}

      {/* Desktop Sidebar List (always visible on large screens) */}
      {isLargeDesktop && (
        <DesktopTruckList
          trucks={trucks}
          onTruckClick={onTruckClick}
        />
      )}
    </div>
  );
};

export default MapView;

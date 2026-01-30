import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Icons
const Icons = {
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  list: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
};

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

// Generate truck positions around center
const getTruckPositions = (center, count) => {
  const offsets = [
    [0.008, 0.012],
    [-0.006, 0.008],
    [0.012, -0.005],
    [-0.010, -0.008],
    [0.004, -0.015],
    [-0.015, 0.003],
    [0.010, 0.005],
    [-0.003, -0.012],
  ];

  return offsets.slice(0, count).map((offset) => [
    center[0] + offset[0],
    center[1] + offset[1],
  ]);
};

const MapView = ({ trucks, loading, onTruckClick, favorites, toggleFavorite }) => {
  const [showList, setShowList] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('prompt'); // 'prompt', 'loading', 'granted', 'denied'

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

  // Location prompt screen
  if (locationStatus === 'prompt') {
    return (
      <div className="map-view-leaflet">
        <div className="location-prompt">
          <div className="location-prompt-content">
            <div className="location-icon-wrapper">
              <span className="location-icon">{Icons.mapPin}</span>
            </div>
            <h2>Find Food Trucks Near You</h2>
            <p>Enable location to see nearby food trucks on the map.</p>
            <div className="location-buttons">
              <button className="location-btn primary" onClick={requestLocation}>
                Enable Location
              </button>
              <button className="location-btn secondary" onClick={skipLocation}>
                Use Portland, OR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (locationStatus === 'loading') {
    return (
      <div className="map-view-leaflet">
        <div className="location-prompt">
          <div className="location-prompt-content">
            <div className="location-loading">
              <div className="loading-spinner"></div>
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
      {/* Map Header */}
      <div className="map-header-leaflet">
        <h1>
          {Icons.mapPin}
          <span>Food Trucks Near You</span>
        </h1>
        <button className="map-list-toggle" onClick={() => setShowList(!showList)}>
          {showList ? Icons.mapPin : Icons.list}
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
              position={truck.lat && truck.lng ? [truck.lat, truck.lng] : truckPositions[index] || mapCenter}
              icon={createTruckIcon(truck)}
            >
              <Popup>
                <div className="popup-content" onClick={() => onTruckClick(truck)}>
                  <div className="popup-image">
                    <img src={truck.image} alt={truck.name} />
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
        <div className="map-legend-leaflet">
          <div className="legend-item">
            <span className="legend-marker featured"></span>
            <span>Featured</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker regular"></span>
            <span>Open</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker user"></span>
            <span>You</span>
          </div>
        </div>

        {/* Recenter Button */}
        <div className="map-controls-leaflet">
          <button className="map-control-btn" onClick={requestLocation}>
            {Icons.target}
          </button>
        </div>
      </div>

      {/* List Overlay */}
      {showList && (
        <div className="map-list-overlay-leaflet">
          <div className="map-list-header">
            <h2>{trucks.length} Food Trucks</h2>
            <button className="close-list-btn" onClick={() => setShowList(false)}>
              {Icons.x}
            </button>
          </div>
          <div className="map-list-content">
            {trucks.map((truck) => (
              <div
                key={truck.id}
                className="map-list-card"
                onClick={() => {
                  onTruckClick(truck);
                  setShowList(false);
                }}
              >
                <div className="list-card-image">
                  <img src={truck.image} alt={truck.name} />
                  {truck.featured && <span className="list-featured-badge">Featured</span>}
                </div>
                <div className="list-card-info">
                  <h3>{truck.name}</h3>
                  <p className="list-cuisine">{truck.cuisine} • {truck.priceRange}</p>
                  <div className="list-meta">
                    <span className="list-rating">{Icons.star} {truck.rating}</span>
                    <span className="list-distance">{truck.distance}</span>
                    <span className={`list-status ${truck.isOpen ? 'open' : 'closed'}`}>
                      {truck.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;

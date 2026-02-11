import { useState, useEffect } from 'react';

// Shared user location hook - reverse geocodes browser geolocation to a city name
// Caches result in sessionStorage so it only geocodes once per session
// Returns { city, coords } where coords is { latitude, longitude } or null

const CACHE_KEY = 'user_location_city';
const COORDS_KEY = 'user_location_coords';

const useUserLocation = (fallback = 'Your Location') => {
  const [city, setCity] = useState(() => {
    return sessionStorage.getItem(CACHE_KEY) || fallback;
  });
  const [coords, setCoords] = useState(() => {
    const cached = sessionStorage.getItem(COORDS_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch { return null; }
    }
    return null;
  });

  useEffect(() => {
    // If already cached, skip
    if (sessionStorage.getItem(CACHE_KEY)) return;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Cache and expose coordinates
          const coordsObj = { latitude, longitude };
          sessionStorage.setItem(COORDS_KEY, JSON.stringify(coordsObj));
          setCoords(coordsObj);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
          const state = data.address?.state || '';
          const stateAbbr = state.length > 3 ? state : state; // Keep short state codes as-is
          const label = cityName && stateAbbr ? `${cityName}, ${stateAbbr}` : cityName || fallback;

          sessionStorage.setItem(CACHE_KEY, label);
          setCity(label);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
        }
      },
      () => {
        // Geolocation denied or failed — keep fallback
      },
      { timeout: 5000 }
    );
  }, [fallback]);

  return { city, coords };
};

export default useUserLocation;

import React, { useEffect, useRef, useState } from 'react';

export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5&addressdetails=1`
    );
    const results = await response.json();
    return results.map(r => ({
      display_name: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch (err) {
    console.error('Geocoding failed:', err);
    return [];
  }
};

const LocationInput = ({ value, coordinates, onChange, required = true, placeholder = 'Search for an address...' }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange({ location: val, coordinates: null });

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length >= 3) {
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        const results = await geocodeAddress(val);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSearching(false);
      }, 400);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({
      location: suggestion.display_name,
      coordinates: { lat: suggestion.lat, lng: suggestion.lng },
    });
  };

  return (
    <div className="location-input-wrapper">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        required={required}
      />
      {searching && <span className="location-searching">Searching...</span>}
      {coordinates && (
        <span className="location-confirmed">Location set</span>
      )}
      {showSuggestions && (
        <ul className="location-suggestions">
          {suggestions.map((s, i) => (
            <li key={i} onMouseDown={() => handleSelect(s)}>
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationInput;

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Icons } from '../components/common/Icons';
import './WaitlistPage.css';

const WaitlistPage = () => {
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState(null); // 'lover' or 'truck'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    // Food lover specific
    cuisines: [],
    // Truck owner specific
    truckName: '',
    cuisine: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const cuisineOptions = [
    { id: 'mexican', label: 'Mexican', emoji: '🌮' },
    { id: 'asian', label: 'Asian', emoji: '🍜' },
    { id: 'bbq', label: 'BBQ', emoji: '🍖' },
    { id: 'pizza', label: 'Pizza', emoji: '🍕' },
    { id: 'burgers', label: 'Burgers', emoji: '🍔' },
    { id: 'seafood', label: 'Seafood', emoji: '🦐' },
    { id: 'vegan', label: 'Vegan', emoji: '🥗' },
    { id: 'desserts', label: 'Desserts', emoji: '🍦' },
    { id: 'coffee', label: 'Coffee', emoji: '☕' },
    { id: 'other', label: 'Other', emoji: '🍽️' },
  ];

  // Get user's location
  const getLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocode to get city name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown';
            const state = data.address?.state || '';
            setFormData(prev => ({ ...prev, location: `${city}, ${state}` }));
          } catch (err) {
            console.error('Geocoding error:', err);
            setFormData(prev => ({ ...prev, location: 'Location detected' }));
          }
          setLocationLoading(false);
        },
        (err) => {
          console.error('Location error:', err);
          setLocationLoading(false);
        }
      );
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('waitlist').insert([
        {
          name: formData.name,
          email: formData.email,
          type: userType,
          status: 'pending',
          metadata: {
            location: formData.location,
            cuisines: userType === 'lover' ? formData.cuisines : null,
            truckName: userType === 'truck' ? formData.truckName : null,
            cuisine: userType === 'truck' ? formData.cuisine : null,
          },
        },
      ]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('This email is already on our waitlist!');
        } else {
          throw insertError;
        }
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle next step
  const nextStep = () => {
    setStep(prev => prev + 1);
  };

  // Handle previous step
  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  // Toggle cuisine selection
  const toggleCuisine = (cuisineId) => {
    setFormData(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisineId)
        ? prev.cuisines.filter(c => c !== cuisineId)
        : [...prev.cuisines, cuisineId],
    }));
  };

  // Validate current step
  const canProceed = () => {
    if (step === 0) return userType !== null;
    if (step === 1) return formData.email.includes('@') && formData.email.includes('.');
    if (step === 2) return formData.name.trim().length >= 2;
    if (step === 3) return formData.location.trim().length > 0;
    if (userType === 'lover' && step === 4) return formData.cuisines.length > 0;
    if (userType === 'truck' && step === 4) return formData.truckName.trim().length > 0;
    if (userType === 'truck' && step === 5) return formData.cuisine.trim().length > 0;
    return true;
  };

  // Get total steps based on user type
  const getTotalSteps = () => {
    return userType === 'truck' ? 6 : 5;
  };

  // Render progress bar
  const renderProgress = () => {
    if (step === 0 || submitted) return null;
    const total = getTotalSteps();
    const progress = ((step) / (total - 1)) * 100;
    return (
      <div className="waitlist-progress">
        <div className="waitlist-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    );
  };

  // Render back button
  const renderBackButton = () => {
    if (step === 0 || submitted) return null;
    return (
      <button className="waitlist-back-btn" onClick={prevStep}>
        {Icons.chevronLeft}
        <span>Back</span>
      </button>
    );
  };

  // Success screen
  if (submitted) {
    return (
      <div className="waitlist-page">
        <div className="waitlist-container">
          <div className="waitlist-success">
            <div className="success-icon">
              {userType === 'lover' ? '🎉' : '🚚'}
            </div>
            <h1>You're on the list!</h1>
            <p>
              {userType === 'lover'
                ? "We'll notify you when Cravvr launches in your area. Get ready to discover amazing food trucks!"
                : "We'll be in touch soon to help you set up your food truck on Cravvr. Exciting times ahead!"}
            </p>
            <div className="success-details">
              <div className="success-detail">
                <span className="detail-label">Email</span>
                <span className="detail-value">{formData.email}</span>
              </div>
              <div className="success-detail">
                <span className="detail-label">Location</span>
                <span className="detail-value">{formData.location}</span>
              </div>
            </div>
            <a href="/" className="waitlist-home-btn">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="waitlist-page">
      {renderProgress()}
      <div className="waitlist-container">
        {renderBackButton()}

        {/* Step 0: User Type Selection */}
        {step === 0 && (
          <div className="waitlist-step fade-in">
            <div className="waitlist-logo">
              <span className="logo-icon">C</span>
              <span className="logo-text">Cravvr</span>
            </div>
            <h1 className="waitlist-title">Join the Waitlist</h1>
            <p className="waitlist-subtitle">
              Be the first to know when we launch in your area
            </p>
            <div className="waitlist-question">
              <h2>Are you a...</h2>
              <div className="user-type-options">
                <button
                  className={`user-type-btn ${userType === 'lover' ? 'selected' : ''}`}
                  onClick={() => setUserType('lover')}
                >
                  <span className="type-emoji">🍔</span>
                  <span className="type-title">Food Lover</span>
                  <span className="type-desc">I want to find amazing food trucks</span>
                </button>
                <button
                  className={`user-type-btn ${userType === 'truck' ? 'selected' : ''}`}
                  onClick={() => setUserType('truck')}
                >
                  <span className="type-emoji">🚚</span>
                  <span className="type-title">Truck Owner</span>
                  <span className="type-desc">I want to grow my food truck business</span>
                </button>
              </div>
            </div>
            <button
              className="waitlist-next-btn"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continue
              {Icons.arrowRight}
            </button>
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="waitlist-step fade-in">
            <div className="step-icon">
              {userType === 'lover' ? '📧' : '📧'}
            </div>
            <h2 className="step-title">What's your email?</h2>
            <p className="step-subtitle">We'll only use this to notify you when we launch</p>
            <div className="waitlist-input-wrapper">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                className="waitlist-input"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && canProceed() && nextStep()}
              />
            </div>
            <button
              className="waitlist-next-btn"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continue
              {Icons.arrowRight}
            </button>
          </div>
        )}

        {/* Step 2: Name */}
        {step === 2 && (
          <div className="waitlist-step fade-in">
            <div className="step-icon">👋</div>
            <h2 className="step-title">What's your name?</h2>
            <p className="step-subtitle">So we know what to call you</p>
            <div className="waitlist-input-wrapper">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="waitlist-input"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && canProceed() && nextStep()}
              />
            </div>
            <button
              className="waitlist-next-btn"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continue
              {Icons.arrowRight}
            </button>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="waitlist-step fade-in">
            <div className="step-icon">📍</div>
            <h2 className="step-title">Where are you located?</h2>
            <p className="step-subtitle">
              {userType === 'lover'
                ? "So we can show you nearby food trucks"
                : "So hungry customers can find you"}
            </p>
            <button
              className="location-btn"
              onClick={getLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <>
                  <span className="location-spinner">{Icons.loader}</span>
                  Detecting location...
                </>
              ) : formData.location ? (
                <>
                  {Icons.mapPin}
                  {formData.location}
                </>
              ) : (
                <>
                  {Icons.mapPin}
                  Tap to share location
                </>
              )}
            </button>
            <div className="location-divider">
              <span>or enter manually</span>
            </div>
            <div className="waitlist-input-wrapper">
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State"
                className="waitlist-input"
                onKeyDown={(e) => e.key === 'Enter' && canProceed() && nextStep()}
              />
            </div>
            <button
              className="waitlist-next-btn"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continue
              {Icons.arrowRight}
            </button>
          </div>
        )}

        {/* Step 4 - Food Lover: Cuisines */}
        {step === 4 && userType === 'lover' && (
          <div className="waitlist-step fade-in">
            <div className="step-icon">😋</div>
            <h2 className="step-title">What cuisines do you love?</h2>
            <p className="step-subtitle">Select all that make your mouth water</p>
            <div className="cuisine-grid">
              {cuisineOptions.map((cuisine) => (
                <button
                  key={cuisine.id}
                  className={`cuisine-btn ${formData.cuisines.includes(cuisine.id) ? 'selected' : ''}`}
                  onClick={() => toggleCuisine(cuisine.id)}
                >
                  <span className="cuisine-emoji">{cuisine.emoji}</span>
                  <span className="cuisine-label">{cuisine.label}</span>
                </button>
              ))}
            </div>
            {error && <div className="waitlist-error">{error}</div>}
            <button
              className="waitlist-next-btn submit"
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner">{Icons.loader}</span>
                  Joining...
                </>
              ) : (
                <>
                  Join Waitlist
                  {Icons.check}
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 4 - Truck Owner: Truck Name */}
        {step === 4 && userType === 'truck' && (
          <div className="waitlist-step fade-in">
            <div className="step-icon">🚚</div>
            <h2 className="step-title">What's your food truck called?</h2>
            <p className="step-subtitle">The name hungry customers will be searching for</p>
            <div className="waitlist-input-wrapper">
              <input
                type="text"
                value={formData.truckName}
                onChange={(e) => setFormData(prev => ({ ...prev, truckName: e.target.value }))}
                placeholder="Truck name"
                className="waitlist-input"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && canProceed() && nextStep()}
              />
            </div>
            <button
              className="waitlist-next-btn"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continue
              {Icons.arrowRight}
            </button>
          </div>
        )}

        {/* Step 5 - Truck Owner: Cuisine Type */}
        {step === 5 && userType === 'truck' && (
          <div className="waitlist-step fade-in">
            <div className="step-icon">🍽️</div>
            <h2 className="step-title">What type of food do you serve?</h2>
            <p className="step-subtitle">Help customers find you by cuisine</p>
            <div className="cuisine-select-grid">
              {cuisineOptions.map((cuisine) => (
                <button
                  key={cuisine.id}
                  className={`cuisine-select-btn ${formData.cuisine === cuisine.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, cuisine: cuisine.id }))}
                >
                  <span className="cuisine-emoji">{cuisine.emoji}</span>
                  <span className="cuisine-label">{cuisine.label}</span>
                </button>
              ))}
            </div>
            {error && <div className="waitlist-error">{error}</div>}
            <button
              className="waitlist-next-btn submit"
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner">{Icons.loader}</span>
                  Joining...
                </>
              ) : (
                <>
                  Join Waitlist
                  {Icons.check}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistPage;

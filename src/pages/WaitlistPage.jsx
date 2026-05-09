import React, { useState } from 'react';
import { joinWaitlist } from '../services/waitlist';
import { Icons } from '../components/common/Icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

const inputClass =
  'h-12 w-full rounded-xl border border-input bg-background px-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

const StepShell = ({ children }) => (
  <div className="flex flex-col items-center text-center space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
    {children}
  </div>
);

const StepHeader = ({ icon, title, subtitle }) => (
  <>
    <div className="text-5xl">{icon}</div>
    <div className="space-y-1.5">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  </>
);

const WaitlistPage = () => {
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    cuisines: [],
    truckName: '',
    cuisine: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const getLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
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

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await joinWaitlist({
        name: formData.name,
        email: formData.email,
        type: userType,
        metadata: {
          location: formData.location,
          cuisines: userType === 'lover' ? formData.cuisines : null,
          truckName: userType === 'truck' ? formData.truckName : null,
          cuisine: userType === 'truck' ? formData.cuisine : null,
        },
      });

      if (result.ok) {
        setSubmitted(true);
      } else if (result.errorCode === 'duplicate') {
        setError('This email is already on our waitlist!');
      } else {
        throw result.rawError || new Error('Submit failed');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const toggleCuisine = (cuisineId) => {
    setFormData(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisineId)
        ? prev.cuisines.filter(c => c !== cuisineId)
        : [...prev.cuisines, cuisineId],
    }));
  };

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

  const totalSteps = userType === 'truck' ? 6 : 5;
  const progress = step === 0 ? 0 : (step / (totalSteps - 1)) * 100;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-background to-background flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center space-y-5">
            <div className="text-6xl">{userType === 'lover' ? '🎉' : '🚚'}</div>
            <h1 className="text-3xl font-bold tracking-tight">You're on the list!</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {userType === 'lover'
                ? "We'll notify you when Cravvr launches in your area. Get ready to discover amazing food trucks!"
                : "We'll be in touch soon to help you set up your food truck on Cravvr. Exciting times ahead!"}
            </p>
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-left">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-semibold truncate">{formData.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="font-semibold truncate">{formData.location}</span>
              </div>
            </div>
            <Button asChild size="lg" className="w-full">
              <a href="/">Back to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-background to-background">
      {step > 0 && (
        <div className="sticky top-0 z-10 h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start justify-center px-4 py-8 sm:py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-6 sm:p-8">
            {step > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="h-4 w-4">{Icons.chevronLeft}</span>
                Back
              </button>
            )}

            {/* Step 0: User Type */}
            {step === 0 && (
              <StepShell>
                <div className="flex items-center gap-2">
                  <img src="/logo/cravvr-logo.png" alt="Cravvr" className="h-9 w-auto" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Join the Waitlist</h1>
                  <p className="text-sm text-muted-foreground">
                    Be the first to know when we launch in your area
                  </p>
                </div>
                <div className="w-full space-y-3">
                  <h2 className="text-base font-semibold">Are you a…</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { type: 'lover', emoji: '🍔', title: 'Food Lover', desc: 'I want to find amazing food trucks' },
                      { type: 'truck', emoji: '🚚', title: 'Truck Owner', desc: 'I want to grow my food truck business' },
                    ].map(opt => {
                      const isActive = userType === opt.type;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setUserType(opt.type)}
                          className={cn(
                            'rounded-xl border-2 p-5 text-center space-y-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            isActive
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border bg-background hover:border-primary/40'
                          )}
                        >
                          <div className="text-3xl">{opt.emoji}</div>
                          <div className="font-bold text-sm">{opt.title}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="w-full gap-2"
                >
                  Continue
                  <span className="h-4 w-4">{Icons.arrowRight}</span>
                </Button>
              </StepShell>
            )}

            {/* Step 1: Email */}
            {step === 1 && (
              <StepShell>
                <StepHeader
                  icon="📧"
                  title="What's your email?"
                  subtitle="We'll only use this to notify you when we launch"
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && nextStep()}
                  className={inputClass}
                />
                <Button size="lg" onClick={nextStep} disabled={!canProceed()} className="w-full gap-2">
                  Continue
                  <span className="h-4 w-4">{Icons.arrowRight}</span>
                </Button>
              </StepShell>
            )}

            {/* Step 2: Name */}
            {step === 2 && (
              <StepShell>
                <StepHeader icon="👋" title="What's your name?" subtitle="So we know what to call you" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && nextStep()}
                  className={inputClass}
                />
                <Button size="lg" onClick={nextStep} disabled={!canProceed()} className="w-full gap-2">
                  Continue
                  <span className="h-4 w-4">{Icons.arrowRight}</span>
                </Button>
              </StepShell>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <StepShell>
                <StepHeader
                  icon="📍"
                  title="Where are you located?"
                  subtitle={userType === 'lover' ? 'So we can show you nearby food trucks' : 'So hungry customers can find you'}
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={getLocation}
                  disabled={locationLoading}
                  className="w-full gap-2"
                >
                  {locationLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                      Detecting location…
                    </>
                  ) : formData.location ? (
                    <>
                      <span className="h-4 w-4 text-primary">{Icons.mapPin}</span>
                      {formData.location}
                    </>
                  ) : (
                    <>
                      <span className="h-4 w-4">{Icons.mapPin}</span>
                      Tap to share location
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-3 text-xs text-muted-foreground w-full">
                  <span className="h-px flex-1 bg-border" />
                  or enter manually
                  <span className="h-px flex-1 bg-border" />
                </div>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State"
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && nextStep()}
                  className={inputClass}
                />
                <Button size="lg" onClick={nextStep} disabled={!canProceed()} className="w-full gap-2">
                  Continue
                  <span className="h-4 w-4">{Icons.arrowRight}</span>
                </Button>
              </StepShell>
            )}

            {/* Step 4 - Lover: Cuisines */}
            {step === 4 && userType === 'lover' && (
              <StepShell>
                <StepHeader icon="😋" title="What cuisines do you love?" subtitle="Select all that make your mouth water" />
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full">
                  {cuisineOptions.map((cuisine) => {
                    const isActive = formData.cuisines.includes(cuisine.id);
                    return (
                      <button
                        key={cuisine.id}
                        type="button"
                        onClick={() => toggleCuisine(cuisine.id)}
                        className={cn(
                          'aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-foreground hover:border-primary/40'
                        )}
                      >
                        <span className="text-2xl">{cuisine.emoji}</span>
                        <span>{cuisine.label}</span>
                      </button>
                    );
                  })}
                </div>
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
                <Button size="lg" onClick={handleSubmit} disabled={!canProceed() || loading} className="w-full gap-2">
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                      Joining…
                    </>
                  ) : (
                    <>
                      Join Waitlist
                      <span className="h-4 w-4">{Icons.check}</span>
                    </>
                  )}
                </Button>
              </StepShell>
            )}

            {/* Step 4 - Truck: Truck Name */}
            {step === 4 && userType === 'truck' && (
              <StepShell>
                <StepHeader
                  icon="🚚"
                  title="What's your food truck called?"
                  subtitle="The name hungry customers will be searching for"
                />
                <input
                  type="text"
                  value={formData.truckName}
                  onChange={(e) => setFormData(prev => ({ ...prev, truckName: e.target.value }))}
                  placeholder="Truck name"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && nextStep()}
                  className={inputClass}
                />
                <Button size="lg" onClick={nextStep} disabled={!canProceed()} className="w-full gap-2">
                  Continue
                  <span className="h-4 w-4">{Icons.arrowRight}</span>
                </Button>
              </StepShell>
            )}

            {/* Step 5 - Truck: Cuisine */}
            {step === 5 && userType === 'truck' && (
              <StepShell>
                <StepHeader icon="🍽️" title="What type of food do you serve?" subtitle="Help customers find you by cuisine" />
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full">
                  {cuisineOptions.map((cuisine) => {
                    const isActive = formData.cuisine === cuisine.id;
                    return (
                      <button
                        key={cuisine.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cuisine: cuisine.id }))}
                        className={cn(
                          'aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-foreground hover:border-primary/40'
                        )}
                      >
                        <span className="text-2xl">{cuisine.emoji}</span>
                        <span>{cuisine.label}</span>
                      </button>
                    );
                  })}
                </div>
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
                <Button size="lg" onClick={handleSubmit} disabled={!canProceed() || loading} className="w-full gap-2">
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                      Joining…
                    </>
                  ) : (
                    <>
                      Join Waitlist
                      <span className="h-4 w-4">{Icons.check}</span>
                    </>
                  )}
                </Button>
              </StepShell>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaitlistPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { fetchMenuItems as fetchTruckMenuItems } from '../../services/menu';
import { Icons } from '../common/Icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSplash from '../common/LoadingSplash';
import { cn } from '@/lib/utils';

// Usage limits
const SIGNED_IN_DAILY_LIMIT = 5;
const GUEST_TOTAL_LIMIT = 1;

const getStorageKey = (userId) => userId ? `bolt_usage_${userId}` : 'bolt_usage_guest';
const getTodayDate = () => new Date().toISOString().split('T')[0];

const getUsageData = (userId) => {
  const key = getStorageKey(userId);
  const stored = localStorage.getItem(key);
  if (!stored) return { count: 0, date: getTodayDate() };
  try {
    return JSON.parse(stored);
  } catch {
    return { count: 0, date: getTodayDate() };
  }
};

const setUsageData = (userId, data) => {
  const key = getStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(data));
};

const BoltView = ({ trucks, loading, onTruckClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    const usage = getUsageData(user?.id);
    const today = getTodayDate();

    if (user) {
      if (usage.date !== today) {
        setUsageData(user.id, { count: 0, date: today });
        setUsageCount(0);
        setIsLimitReached(false);
      } else {
        setUsageCount(usage.count);
        setIsLimitReached(usage.count >= SIGNED_IN_DAILY_LIMIT);
      }
    } else {
      setUsageCount(usage.count);
      setIsLimitReached(usage.count >= GUEST_TOTAL_LIMIT);
    }
  }, [user]);

  const getRemainingUses = () => {
    if (user) return Math.max(0, SIGNED_IN_DAILY_LIMIT - usageCount);
    return Math.max(0, GUEST_TOTAL_LIMIT - usageCount);
  };

  const incrementUsage = () => {
    const today = getTodayDate();
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    setUsageData(user?.id, { count: newCount, date: today });
    const limit = user ? SIGNED_IN_DAILY_LIMIT : GUEST_TOTAL_LIMIT;
    if (newCount >= limit) setIsLimitReached(true);
  };

  const fetchMenuItems = async (truckId) => {
    try {
      const items = await fetchTruckMenuItems(truckId, { limit: 10 });
      return items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.priceFormatted,
        emoji: item.emoji,
      }));
    } catch (err) {
      console.error('Error fetching menu:', err);
      return [];
    }
  };

  const handleGenerate = async () => {
    if (trucks.length === 0) return;
    if (isLimitReached) return;

    setIsGenerating(true);
    setGenerated(null);

    setTimeout(async () => {
      const randomTruck = trucks[Math.floor(Math.random() * trucks.length)];
      const items = await fetchMenuItems(randomTruck.id);

      let selectedItems = [];
      if (items.length >= 2) {
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        selectedItems = shuffled.slice(0, 2);
      } else if (items.length === 1) {
        selectedItems = items;
      } else {
        selectedItems = [
          { id: 1, name: 'Signature Special', description: 'Our most popular dish', price: '$12.99', emoji: '🌟' },
          { id: 2, name: "Chef's Choice", description: "Today's recommended pick", price: '$14.99', emoji: '👨‍🍳' },
        ];
      }

      incrementUsage();
      setGenerated({ truck: randomTruck, items: selectedItems });
      setIsGenerating(false);
    }, 1500);
  };

  if (loading) {
    return <LoadingSplash tagline="LOADING TRUCKS" />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-background to-rose-100/40">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 25%, rgba(225, 29, 72, 0.18) 0px, transparent 45%), radial-gradient(circle at 80% 75%, rgba(225, 29, 72, 0.10) 0px, transparent 45%)',
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center px-5 py-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div
            className={cn(
              'relative flex h-20 w-20 items-center justify-center',
              isGenerating && 'animate-spin-slow'
            )}
          >
            <span className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-rose-700 text-primary-foreground shadow-lg shadow-primary/30">
              <span className="h-7 w-7">{Icons.bolt}</span>
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-rose-700 bg-clip-text text-transparent">
            Bolt
          </h1>
          <p className="text-sm text-muted-foreground">Instant food truck discovery</p>

          {/* Usage Counter */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
              user ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
            )}
          >
            <span className="h-3.5 w-3.5">{user ? Icons.bolt : Icons.user}</span>
            <span>
              {user
                ? `${getRemainingUses()} of ${SIGNED_IN_DAILY_LIMIT} left today`
                : getRemainingUses() > 0 ? '1 free try' : 'Sign up for more'}
            </span>
          </span>
        </div>

        {/* Main */}
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          {/* Limit reached */}
          {isLimitReached && !generated && !isGenerating && (
            <Card className="w-full shadow-xl">
              <CardContent className="flex flex-col items-center text-center py-10 px-6 space-y-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <span className="h-8 w-8">{Icons.lock}</span>
                </span>
                {user ? (
                  <>
                    <h2 className="text-xl font-bold tracking-tight">Daily Limit Reached</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      You've used all 5 Bolt picks for today. Come back tomorrow for more instant discoveries!
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      <span className="h-3.5 w-3.5">{Icons.clock}</span>
                      Resets at midnight
                    </span>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold tracking-tight">Want More Picks?</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Sign up for a free account to get 5 Bolt picks every day!
                    </p>
                    <Button size="lg" onClick={() => navigate('/eat')} className="gap-2 w-full">
                      <span className="h-4 w-4">{Icons.user}</span>
                      Sign Up Free
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/eat')}
                        className="font-semibold text-primary hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Initial */}
          {!generated && !isGenerating && !isLimitReached && (
            <div className="flex flex-col items-center text-center space-y-6 w-full">
              <div className="relative w-full max-w-xs aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-muted/50 to-muted ring-1 ring-black/5 shadow-md">
                <div
                  aria-hidden
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2.5s_infinite]"
                  style={{ animationName: 'shimmer' }}
                />
                <div className="relative h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <span className="h-12 w-12">{Icons.truck}</span>
                  <span className="text-sm font-medium">Your next meal awaits</span>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleGenerate}
                className="gap-2 w-full shadow-lg shadow-primary/30"
              >
                <span className="h-5 w-5">{Icons.bolt}</span>
                Generate Pick
              </Button>

              <p className="text-xs text-muted-foreground">
                {trucks.length} trucks available nearby
              </p>
            </div>
          )}

          {/* Generating */}
          {isGenerating && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative h-40 w-64">
                {[0, 1, 2].map((i) => (
                  <Card
                    key={i}
                    className="absolute inset-0 shadow-lg"
                    style={{
                      transform: `rotate(${(i - 1) * 6}deg) translateY(${i * 4}px)`,
                      opacity: 1 - i * 0.25,
                      zIndex: 3 - i,
                      animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  >
                    <CardContent className="h-full flex items-center justify-center">
                      <span className="h-8 w-8 text-muted-foreground/40">{Icons.truck}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                Finding your perfect match…
              </p>
            </div>
          )}

          {/* Result */}
          {generated && !isGenerating && (
            <div className="flex flex-col items-center gap-4 w-full">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-rose-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow">
                <span className="h-3.5 w-3.5">{Icons.bolt}</span>
                Your Pick
              </span>

              <Card
                className="w-full overflow-hidden shadow-xl transition-transform hover:-translate-y-0.5 cursor-pointer"
                onClick={() => onTruckClick(generated.truck)}
              >
                <div className="relative h-40 overflow-hidden bg-muted">
                  <img
                    src={generated.truck.image}
                    alt={generated.truck.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>

                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold tracking-tight leading-tight truncate">
                        {generated.truck.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">{generated.truck.cuisine}</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                      <span className="h-3.5 w-3.5">{Icons.star}</span>
                      <span className="tabular-nums">{generated.truck.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3.5 w-3.5">{Icons.clock}</span>
                      {generated.truck.prepTime || 'Order ahead'}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3.5 w-3.5">{Icons.mapPin}</span>
                      {generated.truck.distance}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="font-semibold">{generated.truck.priceRange}</span>
                  </div>

                  <div className="border-t border-border" />

                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Try these
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {generated.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                        >
                          <span className="text-base">{item.emoji}</span>
                          <span className="flex-1 truncate font-medium">{item.name}</span>
                          <span className="font-bold tabular-nums text-primary">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 text-sm font-semibold text-primary">
                    <span>View Menu</span>
                    <span className="h-4 w-4 transition-transform group-hover:translate-x-1">
                      {Icons.arrowRight}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                size="lg"
                onClick={handleGenerate}
                disabled={isLimitReached}
                className="gap-2 w-full"
              >
                <span className="h-4 w-4">{Icons.refresh}</span>
                {isLimitReached ? 'Limit Reached' : 'Try Again'}
              </Button>
              {isLimitReached && !user && (
                <p className="text-xs text-muted-foreground text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/eat')}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign up
                  </button>{' '}
                  for 5 daily picks
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default BoltView;

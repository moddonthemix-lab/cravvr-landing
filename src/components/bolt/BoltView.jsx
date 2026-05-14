import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { fetchMenuItems as fetchTruckMenuItems } from '../../services/menu';
import { Icons } from '../common/Icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSplash from '../common/LoadingSplash';
import { cn } from '@/lib/utils';

const SIGNED_IN_DAILY_LIMIT = 5;
const GUEST_TOTAL_LIMIT = 1;
const HISTORY_LIMIT = 5;

const getStorageKey = (userId) => userId ? `bolt_usage_${userId}` : 'bolt_usage_guest';
const getHistoryKey = (userId) => userId ? `bolt_history_${userId}` : 'bolt_history_guest';
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

const getHistory = (userId) => {
  const stored = localStorage.getItem(getHistoryKey(userId));
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

const setHistory = (userId, list) => {
  localStorage.setItem(getHistoryKey(userId), JSON.stringify(list));
};

const BoltView = ({ trucks, loading, onTruckClick }) => {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [history, setHistoryState] = useState([]);

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

    setHistoryState(getHistory(user?.id));
  }, [user]);

  const getRemainingUses = () => {
    if (user) return Math.max(0, SIGNED_IN_DAILY_LIMIT - usageCount);
    return Math.max(0, GUEST_TOTAL_LIMIT - usageCount);
  };

  const totalLimit = user ? SIGNED_IN_DAILY_LIMIT : GUEST_TOTAL_LIMIT;
  const remaining = getRemainingUses();
  const usagePct = totalLimit > 0 ? (usageCount / totalLimit) * 100 : 0;

  const incrementUsage = () => {
    const today = getTodayDate();
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    setUsageData(user?.id, { count: newCount, date: today });
    if (newCount >= totalLimit) setIsLimitReached(true);
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

  const pushHistory = (entry) => {
    const next = [entry, ...history.filter(h => h.truck.id !== entry.truck.id)].slice(0, HISTORY_LIMIT);
    setHistoryState(next);
    setHistory(user?.id, next);
  };

  const handleGenerate = async () => {
    if (trucks.length === 0) return;
    if (isLimitReached) return;

    setIsGenerating(true);
    setGenerated(null);

    setTimeout(async () => {
      const recentIds = new Set(history.slice(0, 2).map(h => h.truck.id));
      const pool = trucks.filter(t => !recentIds.has(t.id));
      const candidates = pool.length > 0 ? pool : trucks;
      const randomTruck = candidates[Math.floor(Math.random() * candidates.length)];
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
      const entry = { truck: randomTruck, items: selectedItems, at: Date.now() };
      setGenerated(entry);
      pushHistory(entry);
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

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-10 lg:items-start">
          {/* Main column */}
          <div className="flex flex-col items-center w-full max-w-md mx-auto lg:max-w-none">
            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-3 mb-6 sm:mb-8">
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
              <p className="text-sm text-muted-foreground max-w-sm">
                Tap once, get an instant truck + menu pick chosen for you.
              </p>

              {/* Usage Counter with progress */}
              <div
                className={cn(
                  'inline-flex flex-col items-center gap-2 rounded-2xl border px-4 py-3 min-w-[240px]',
                  user ? 'border-primary/20 bg-primary/5' : 'border-warning/20 bg-warning/5'
                )}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={cn('h-3.5 w-3.5', user ? 'text-primary' : 'text-warning')}>
                    {user ? Icons.bolt : Icons.user}
                  </span>
                  <span className={user ? 'text-primary' : 'text-warning'}>
                    {user
                      ? `${remaining} of ${SIGNED_IN_DAILY_LIMIT} picks left today`
                      : remaining > 0
                        ? '1 free pick — sign up for 5/day'
                        : 'Sign up for 5 picks/day'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      user ? 'bg-primary' : 'bg-warning'
                    )}
                    style={{ width: `${Math.min(100, usagePct)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="w-full flex flex-col items-center justify-center">
              {/* Limit reached */}
              {isLimitReached && !generated && !isGenerating && (
                <Card className="w-full shadow-xl">
                  <CardContent className="flex flex-col items-center text-center py-10 px-6 space-y-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <span className="h-8 w-8">{Icons.lock}</span>
                    </span>
                    {user ? (
                      <>
                        <h2 className="text-xl font-bold tracking-tight">Daily limit reached</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          You've used all 5 Bolt picks for today. Come back tomorrow for more.
                        </p>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          <span className="h-3.5 w-3.5">{Icons.clock}</span>
                          Resets at midnight
                        </span>
                      </>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold tracking-tight">Want more picks?</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Sign up for a free account to get 5 Bolt picks every day.
                        </p>
                        <Button size="lg" onClick={() => openAuth('signup')} className="gap-2 w-full">
                          <span className="h-4 w-4">{Icons.user}</span>
                          Sign up free
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Already have an account?{' '}
                          <button
                            type="button"
                            onClick={() => openAuth('login')}
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
                    className="gap-2 w-full max-w-xs shadow-lg shadow-primary/30"
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
                <div className="flex flex-col items-center gap-6 py-6">
                  <div className="relative h-40 w-64">
                    {[0, 1, 2].map((i) => (
                      <Card
                        key={i}
                        className="absolute inset-0 shadow-lg"
                        style={{
                          transform: `translate3d(0, ${i * 4}px, 0) rotate(${(i - 1) * 6}deg)`,
                          opacity: 1 - i * 0.25,
                          zIndex: 3 - i,
                          animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                          willChange: 'transform',
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
                    className="w-full overflow-hidden shadow-xl transition-transform hover:-translate-y-0.5 cursor-pointer group"
                    onClick={() => onTruckClick(generated.truck)}
                  >
                    <div className="relative h-44 sm:h-52 overflow-hidden bg-muted">
                      <img
                        src={generated.truck.image}
                        alt={generated.truck.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm',
                            generated.truck.isOpen
                              ? 'bg-positive text-white'
                              : 'bg-black/70 text-white backdrop-blur'
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              generated.truck.isOpen ? 'bg-white' : 'bg-white/60'
                            )}
                          />
                          {generated.truck.isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h2 className="text-xl font-bold leading-tight drop-shadow-md truncate">
                          {generated.truck.name}
                        </h2>
                        <p className="text-xs text-white/90 truncate">
                          {[generated.truck.cuisine, generated.truck.priceRange].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {generated.truck.rating && (
                          <span className="inline-flex items-center gap-1 text-warning font-semibold">
                            <span className="h-3.5 w-3.5">{Icons.star}</span>
                            <span className="tabular-nums">{generated.truck.rating}</span>
                          </span>
                        )}
                        {generated.truck.prepTime && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="h-3.5 w-3.5">{Icons.clock}</span>
                              {generated.truck.prepTime}
                            </span>
                          </>
                        )}
                        {generated.truck.distance && generated.truck.distance !== '--' && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="h-3.5 w-3.5">{Icons.mapPin}</span>
                              {generated.truck.distance}
                            </span>
                          </>
                        )}
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
                        <span>View truck & menu</span>
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
                    className="gap-2 w-full max-w-xs"
                  >
                    <span className="h-4 w-4">{Icons.refresh}</span>
                    {isLimitReached ? 'Limit reached' : 'Try again'}
                  </Button>
                  {isLimitReached && !user && (
                    <p className="text-xs text-muted-foreground text-center">
                      <button
                        type="button"
                        onClick={() => openAuth('signup')}
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

            {/* Mobile-only: recent picks below */}
            {history.length > 0 && (
              <div className="lg:hidden w-full mt-10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  Recent picks
                </h3>
                <div className="space-y-2">
                  {history.map((h) => (
                    <RecentPickRow
                      key={`${h.truck.id}-${h.at}`}
                      entry={h}
                      onClick={() => onTruckClick(h.truck)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side panel (desktop only) */}
          <aside className="hidden lg:flex flex-col gap-5 pt-2 sticky top-6">
            <section className="rounded-2xl border border-border bg-card/80 backdrop-blur p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="h-4 w-4">{Icons.bolt}</span>
                </span>
                <h3 className="font-bold tracking-tight">How Bolt works</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    1
                  </span>
                  <span>Hit <span className="font-semibold text-foreground">Generate Pick</span> and Bolt grabs a random truck near you.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    2
                  </span>
                  <span>We surface two of its standout menu items so you can decide fast.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    3
                  </span>
                  <span>Tap the card to view the full truck & menu, or hit <span className="font-semibold text-foreground">Try again</span> for another roll.</span>
                </li>
              </ul>
            </section>

            {history.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Recent picks
                  </h3>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {history.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {history.map((h) => (
                    <RecentPickRow
                      key={`${h.truck.id}-${h.at}`}
                      entry={h}
                      onClick={() => onTruckClick(h.truck)}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-dashed border-border bg-background/50 p-5 text-center">
                <div className="text-3xl mb-2">🎲</div>
                <p className="text-sm font-semibold mb-1">No picks yet</p>
                <p className="text-xs text-muted-foreground">
                  Your Bolt history will show up here once you start rolling.
                </p>
              </section>
            )}
          </aside>
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

const RecentPickRow = ({ entry, onClick }) => {
  const { truck, items } = entry;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3 text-left hover:border-primary/40 transition-colors"
    >
      <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
        {truck.image && (
          <img src={truck.image} alt={truck.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate">{truck.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {items?.[0]?.name || truck.cuisine || '—'}
        </div>
      </div>
      <span className="h-4 w-4 text-muted-foreground shrink-0">{Icons.arrowRight}</span>
    </button>
  );
};

export default BoltView;

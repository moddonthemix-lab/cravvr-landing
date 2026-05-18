import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Rocket, Store, MapPin, Clock, ImageIcon, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '../../contexts/ToastContext';
import { createOwnerTruck, updateTruck } from '../../services/trucks';
import LocationInput, { geocodeAddress } from '../truck-form/LocationInput';
import HoursInput, { getDefaultHours, parseHours } from '../truck-form/HoursInput';
import ImageUpload from '../common/ImageUpload';
import PaymentProcessorSetup from './PaymentProcessorSetup';

const CUISINES = [
  'Mexican', 'American', 'Asian', 'Italian', 'BBQ',
  'Seafood', 'Indian', 'Mediterranean', 'Fusion', 'Other',
];
const PRICE_RANGES = [
  { value: '$', label: '$ (Budget)' },
  { value: '$$', label: '$$ (Moderate)' },
  { value: '$$$', label: '$$$ (Premium)' },
  { value: '$$$$', label: '$$$$ (Luxury)' },
];
const PREP_TIMES = ['5-10 min', '10-15 min', '15-25 min', '20-30 min', '30-45 min', '45-60 min'];

const STEPS = [
  { id: 'welcome',  title: "Let's get you rolling",          icon: Rocket,      skippable: false },
  { id: 'basics',   title: 'Name your truck',                icon: Store,       skippable: false },
  { id: 'location', title: 'Where do you serve?',            icon: MapPin,      skippable: false },
  { id: 'hours',    title: 'When are you open?',             icon: Clock,       skippable: true  },
  { id: 'photo',    title: 'Show off your truck',            icon: ImageIcon,   skippable: true  },
  { id: 'payment',  title: 'Get paid',                       icon: CreditCard,  skippable: true  },
];

const emptyForm = () => ({
  name: '',
  cuisine: '',
  price_range: '$',
  description: '',
  location: '',
  coordinates: null,
  hours: getDefaultHours(),
  phone: '',
  image_url: '',
  estimated_prep_time: '15-25 min',
});

export default function OwnerOnboardingWizard({ open, onOpenChange, ownerId, existingTruck, onTruckCreated, onTruckUpdated }) {
  const { showToast } = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [createdTruck, setCreatedTruck] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBusy(false);
    if (existingTruck) {
      setForm({
        name: existingTruck.name || '',
        cuisine: existingTruck.cuisine || '',
        price_range: existingTruck.price_range || '$',
        description: existingTruck.description || '',
        location: existingTruck.location || '',
        coordinates: existingTruck.coordinates || null,
        hours: parseHours(existingTruck.hours),
        phone: existingTruck.phone || '',
        image_url: existingTruck.image_url || '',
        estimated_prep_time: existingTruck.estimated_prep_time || '15-25 min',
      });
      setCreatedTruck(existingTruck);
      // Jump to the first incomplete step so we don't waste their time on
      // fields they've already filled in.
      if (!existingTruck.image_url) setStepIndex(STEPS.findIndex((s) => s.id === 'photo'));
      else if (!existingTruck.payment_processor) setStepIndex(STEPS.findIndex((s) => s.id === 'payment'));
      else setStepIndex(0);
    } else {
      setForm(emptyForm());
      setCreatedTruck(null);
      setStepIndex(0);
    }
  }, [open, existingTruck]);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const canAdvance = useMemo(() => {
    if (step.id === 'basics') return !!form.name.trim() && !!form.cuisine;
    if (step.id === 'location') return !!form.location.trim();
    return true;
  }, [step.id, form.name, form.cuisine, form.location]);

  const patch = (next) => setForm((prev) => ({ ...prev, ...next }));

  const ensureTruck = async () => {
    if (createdTruck) return createdTruck;
    let coords = form.coordinates;
    if (!coords && form.location) {
      try {
        const results = await geocodeAddress(form.location);
        if (results.length > 0) coords = { lat: results[0].lat, lng: results[0].lng };
      } catch {
        // geocoding is best-effort; the row can still be saved without coords
      }
    }
    const data = await createOwnerTruck(ownerId, {
      name: form.name.trim(),
      cuisine: form.cuisine,
      price_range: form.price_range,
      description: form.description,
      location: form.location.trim(),
      coordinates: coords,
    });
    setCreatedTruck(data);
    onTruckCreated?.(data);
    return data;
  };

  const persistStep = async () => {
    if (step.id === 'basics' && createdTruck) {
      await updateTruck(createdTruck.id, {
        name: form.name.trim(),
        cuisine: form.cuisine,
        price_range: form.price_range,
        description: form.description,
      });
      onTruckUpdated?.();
      return;
    }
    if (step.id === 'location') {
      if (createdTruck) {
        let coords = form.coordinates;
        if (!coords && form.location) {
          try {
            const results = await geocodeAddress(form.location);
            if (results.length > 0) coords = { lat: results[0].lat, lng: results[0].lng };
          } catch { /* best-effort */ }
        }
        await updateTruck(createdTruck.id, {
          location: form.location.trim(),
          coordinates: coords,
        });
        onTruckUpdated?.();
      } else {
        await ensureTruck();
      }
      return;
    }
    if (!createdTruck) return;
    if (step.id === 'hours') {
      await updateTruck(createdTruck.id, {
        hours: JSON.stringify(form.hours),
        estimated_prep_time: form.estimated_prep_time,
      });
      onTruckUpdated?.();
    } else if (step.id === 'photo') {
      const updates = {};
      if (form.image_url) updates.image_url = form.image_url;
      if (form.phone) updates.phone = form.phone;
      if (form.description) updates.description = form.description;
      if (Object.keys(updates).length > 0) {
        await updateTruck(createdTruck.id, updates);
        onTruckUpdated?.();
      }
    }
  };

  const handleNext = async () => {
    if (!canAdvance || busy) return;
    setBusy(true);
    try {
      await persistStep();
      if (isLast) {
        onOpenChange(false);
      } else {
        setStepIndex((i) => i + 1);
      }
    } catch (err) {
      console.error('Onboarding step failed:', err);
      showToast(err?.message || 'Could not save. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = () => {
    if (busy) return;
    if (isLast) onOpenChange(false);
    else setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (busy || stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <step.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg">{step.title}</DialogTitle>
              <DialogDescription className="text-xs">
                Step {stepIndex + 1} of {STEPS.length}
              </DialogDescription>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  i < stepIndex ? 'bg-primary' : i === stepIndex ? 'bg-primary/60' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {step.id === 'welcome' && <WelcomeStep />}
          {step.id === 'basics' && <BasicsStep form={form} patch={patch} />}
          {step.id === 'location' && <LocationStep form={form} patch={patch} />}
          {step.id === 'hours' && <HoursStep form={form} patch={patch} />}
          {step.id === 'photo' && <PhotoStep form={form} patch={patch} truckId={createdTruck?.id} />}
          {step.id === 'payment' && <PaymentStep truck={createdTruck} onUpdate={onTruckUpdated} />}
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={stepIndex === 0 || busy}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {step.skippable && !isLast && (
              <Button type="button" variant="ghost" onClick={handleSkip} disabled={busy}>
                Skip
              </Button>
            )}
            {isLast ? (
              <Button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="gap-2">
                <Check className="h-4 w-4" />
                Finish
              </Button>
            ) : (
              <Button type="button" onClick={handleNext} disabled={!canAdvance || busy} className="gap-2">
                {busy ? 'Saving…' : stepIndex === 0 ? 'Get started' : 'Next'}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WelcomeStep() {
  return (
    <div className="space-y-4 py-4 text-center">
      <p className="text-base text-foreground">
        We'll walk you through getting your truck live in a few quick steps.
      </p>
      <ul className="mx-auto max-w-md space-y-2 text-left text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
          Name your truck, pick a cuisine, set your location
        </li>
        <li className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
          Add hours, a photo, and a phone number
        </li>
        <li className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
          Connect Stripe, Square, or Pay-at-Pickup — funds go straight to you
        </li>
      </ul>
      <p className="text-xs text-muted-foreground">
        You can skip any optional step and finish later from your dashboard.
      </p>
    </div>
  );
}

function BasicsStep({ form, patch }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ob-name">Truck name <span className="text-destructive">*</span></Label>
        <Input
          id="ob-name"
          placeholder="e.g. Taco Loco Express"
          value={form.name}
          onChange={(e) => patch({ name: e.target.value })}
          autoFocus
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cuisine <span className="text-destructive">*</span></Label>
          <Select value={form.cuisine} onValueChange={(v) => patch({ cuisine: v })}>
            <SelectTrigger><SelectValue placeholder="Select cuisine" /></SelectTrigger>
            <SelectContent>
              {CUISINES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Price range</Label>
          <Select value={form.price_range} onValueChange={(v) => patch({ price_range: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ob-desc">Short description</Label>
        <Textarea
          id="ob-desc"
          placeholder="A line or two customers will see on your truck card."
          rows={3}
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </div>
    </div>
  );
}

function LocationStep({ form, patch }) {
  return (
    <div className="space-y-2">
      <Label>Where will customers find you? <span className="text-destructive">*</span></Label>
      <LocationInput
        value={form.location}
        coordinates={form.coordinates}
        onChange={({ location, coordinates }) => patch({ location, coordinates })}
      />
      <p className="text-xs text-muted-foreground">
        You can update this anytime — handy for trucks that move around.
      </p>
    </div>
  );
}

function HoursStep({ form, patch }) {
  return (
    <div className="space-y-5">
      <HoursInput hours={form.hours} onChange={(hours) => patch({ hours })} />
      <div className="space-y-2">
        <Label>Estimated prep time</Label>
        <Select
          value={form.estimated_prep_time}
          onValueChange={(v) => patch({ estimated_prep_time: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PREP_TIMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function PhotoStep({ form, patch, truckId }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Truck photo</Label>
        <ImageUpload
          label=""
          currentImage={form.image_url}
          onUpload={(url) => patch({ image_url: url })}
          bucket="images"
          folder={truckId ? `trucks/${truckId}` : 'trucks/temp'}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ob-phone">Contact phone</Label>
        <Input
          id="ob-phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={form.phone}
          onChange={(e) => patch({ phone: e.target.value })}
        />
      </div>
    </div>
  );
}

function PaymentStep({ truck, onUpdate }) {
  if (!truck) {
    return (
      <p className="text-sm text-muted-foreground">
        Save the previous step first to set up payments.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pick how customers pay. You can connect more than one later. Funds always go directly to you — Cravvr never takes a cut.
      </p>
      <PaymentProcessorSetup truck={truck} onUpdate={() => onUpdate?.()} />
    </div>
  );
}

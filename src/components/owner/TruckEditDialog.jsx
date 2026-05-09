import React, { useEffect, useState } from 'react';
import { Info, MapPin, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '../../contexts/ToastContext';
import LocationInput, { geocodeAddress } from '../truck-form/LocationInput';
import HoursInput, { getDefaultHours, parseHours } from '../truck-form/HoursInput';
import ImageUpload from '../common/ImageUpload';

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

export default function TruckEditDialog({ open, onOpenChange, truck, onCreate, onUpdate }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [tab, setTab] = useState('basics');
  const [saving, setSaving] = useState(false);

  // Hydrate form when opening / when truck changes
  useEffect(() => {
    if (!open) return;
    if (truck) {
      setFormData({
        name: truck.name || '',
        cuisine: truck.cuisine || '',
        price_range: truck.price_range || '$',
        description: truck.description || '',
        location: truck.location || '',
        coordinates: truck.coordinates || null,
        hours: parseHours(truck.hours),
        phone: truck.phone || '',
        image_url: truck.image_url || '',
        estimated_prep_time: truck.estimated_prep_time || '15-25 min',
      });
    } else {
      setFormData(emptyForm());
    }
    setTab('basics');
  }, [open, truck]);

  const isEdit = !!truck;
  const missingBasics = !formData.name || !formData.cuisine;
  const missingLocation = !formData.location;
  const canSave = !missingBasics && !missingLocation && !saving;

  const handleSave = async () => {
    if (missingBasics) {
      showToast('Truck name and cuisine are required.', 'error');
      setTab('basics');
      return;
    }
    if (missingLocation) {
      showToast('A location is required.', 'error');
      setTab('location');
      return;
    }

    setSaving(true);
    try {
      let coords = formData.coordinates;
      if (!coords && formData.location) {
        const results = await geocodeAddress(formData.location);
        if (results.length > 0) coords = { lat: results[0].lat, lng: results[0].lng };
      }
      const payload = {
        ...formData,
        coordinates: coords,
        hours: JSON.stringify(formData.hours),
      };
      if (isEdit) await onUpdate(truck.id, payload);
      else await onCreate(payload);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save truck:', err);
      showToast('Failed to save truck. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-xl">
            {isEdit ? `Edit ${truck.name || 'Truck'}` : 'Add New Truck'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details customers see when they find your truck.'
              : 'Set up the basics — you can fine-tune anything later.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col">
          <div className="border-b px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basics" className="gap-2">
                <Info className="h-4 w-4" />
                <span>Basics</span>
                {missingBasics && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                )}
              </TabsTrigger>
              <TabsTrigger value="location" className="gap-2">
                <MapPin className="h-4 w-4" />
                <span>Location & Hours</span>
                {missingLocation && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                )}
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-2">
                <Phone className="h-4 w-4" />
                <span>Contact & Photo</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
            <TabsContent value="basics" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="truck-name">Truck Name <span className="text-destructive">*</span></Label>
                <Input
                  id="truck-name"
                  placeholder="e.g. Taco Loco Express"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cuisine Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.cuisine}
                    onValueChange={(v) => setFormData({ ...formData, cuisine: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select cuisine" /></SelectTrigger>
                    <SelectContent>
                      {CUISINES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <Select
                    value={formData.price_range}
                    onValueChange={(v) => setFormData({ ...formData, price_range: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRICE_RANGES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="truck-desc">Description</Label>
                <Textarea
                  id="truck-desc"
                  placeholder="Describe your truck and cuisine..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="location" className="mt-0 space-y-5">
              <div className="space-y-2">
                <Label>Location <span className="text-destructive">*</span></Label>
                <LocationInput
                  value={formData.location}
                  coordinates={formData.coordinates}
                  onChange={({ location, coordinates }) =>
                    setFormData({ ...formData, location, coordinates })
                  }
                />
              </div>
              <HoursInput
                hours={formData.hours}
                onChange={(hours) => setFormData({ ...formData, hours })}
              />
            </TabsContent>

            <TabsContent value="contact" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="truck-phone">Phone</Label>
                  <Input
                    id="truck-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Prep Time</Label>
                  <Select
                    value={formData.estimated_prep_time}
                    onValueChange={(v) => setFormData({ ...formData, estimated_prep_time: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PREP_TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Truck Photo</Label>
                <ImageUpload
                  label=""
                  currentImage={formData.image_url}
                  onUpload={(url) => setFormData({ ...formData, image_url: url })}
                  bucket="images"
                  folder={isEdit ? `trucks/${truck.id}` : 'trucks/temp'}
                  disabled={saving}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-4 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Truck')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

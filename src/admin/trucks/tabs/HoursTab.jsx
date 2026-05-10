import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import HoursInput, { parseHours } from '../../../components/truck-form/HoursInput';
import { Icons } from '../../../components/common/Icons';
import { useTruckAdmin } from '../hooks/useTruckAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const HoursTab = () => {
  const { truck, refetch } = useOutletContext();
  const { updateTruck, busy } = useTruckAdmin();
  const [hours, setHours] = useState(parseHours(truck.hours));
  const [reason, setReason] = useState('');

  useEffect(() => { setHours(parseHours(truck.hours)); }, [truck.hours]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateTruck(truck.id, { hours }, reason || null);
    setReason('');
    refetch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5"
    >
      <h2 className="text-xl font-bold tracking-tight">Hours of Operation</h2>
      <HoursInput hours={hours} onChange={setHours} label={null} />

      <div className="space-y-2">
        <Label htmlFor="hours-reason">Audit reason</Label>
        <Input
          id="hours-reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy} className="gap-1.5">
          {busy ? (
            'Saving…'
          ) : (
            <>
              <span className="h-4 w-4">{Icons.check}</span>
              Save hours
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default HoursTab;

import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import HoursInput, { parseHours } from '../../../components/truck-form/HoursInput';
import { Icons } from '../../../components/common/Icons';
import { useTruckAdmin } from '../hooks/useTruckAdmin';

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
    <form className="admin-tab-form" onSubmit={handleSubmit}>
      <h2>Hours of Operation</h2>
      <HoursInput hours={hours} onChange={setHours} label={null} />
      <div className="form-group">
        <label>Audit reason</label>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving...' : <>{Icons.check} Save hours</>}
        </button>
      </div>
    </form>
  );
};

export default HoursTab;

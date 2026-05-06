import React from 'react';

export const getDefaultHours = () => ({
  monday: { open: '11:00', close: '22:00', closed: false },
  tuesday: { open: '11:00', close: '22:00', closed: false },
  wednesday: { open: '11:00', close: '22:00', closed: false },
  thursday: { open: '11:00', close: '22:00', closed: false },
  friday: { open: '11:00', close: '22:00', closed: false },
  saturday: { open: '11:00', close: '22:00', closed: false },
  sunday: { open: '11:00', close: '22:00', closed: false },
});

export const parseHours = (hoursString) => {
  if (!hoursString) return getDefaultHours();
  if (typeof hoursString === 'object') return { ...getDefaultHours(), ...hoursString };
  try {
    const parsed = JSON.parse(hoursString);
    return { ...getDefaultHours(), ...parsed };
  } catch (e) {
    return getDefaultHours();
  }
};

const to12hr = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
};

const TIME_OPTIONS = (() => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (const m of ['00', '30']) {
      const value = `${h.toString().padStart(2, '0')}:${m}`;
      options.push({ value, label: to12hr(value) });
    }
  }
  return options;
})();

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const HoursInput = ({ hours, onChange, label = 'Hours of Operation' }) => {
  const handleDayChange = (day, field, value) => {
    onChange({
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value,
      },
    });
  };

  return (
    <div className="hours-input-container">
      {label && <label className="form-label">{label}</label>}
      <div className="hours-grid">
        {DAYS.map((day, idx) => (
          <div key={day} className="hours-row">
            <div className="day-label">{DAY_LABELS[idx]}</div>
            <div className="hours-controls">
              <label className="hours-toggle">
                <input
                  type="checkbox"
                  checked={!hours[day].closed}
                  onChange={(e) => handleDayChange(day, 'closed', !e.target.checked)}
                />
                <span>{hours[day].closed ? 'Closed' : 'Open'}</span>
              </label>
              {!hours[day].closed && (
                <>
                  <select
                    value={hours[day].open}
                    onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                    className="time-select"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={`open-${t.value}`} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <span className="time-separator">to</span>
                  <select
                    value={hours[day].close}
                    onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                    className="time-select"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={`close-${t.value}`} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoursInput;

import React, { useState } from 'react';
import { AppSettings } from '../models/types';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const DAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export function Settings({ settings, onSave }: SettingsProps) {
  const [maxDailyHours, setMaxDailyHours] = useState(settings.maxDailyHours);
  const [weekendDays, setWeekendDays] = useState<number[]>(settings.weekendDays || [0, 6]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ maxDailyHours, weekendDays });
  };

  const toggleWeekendDay = (dayIndex: number) => {
    if (weekendDays.includes(dayIndex)) {
      setWeekendDays(weekendDays.filter(d => d !== dayIndex));
    } else {
      setWeekendDays([...weekendDays, dayIndex].sort());
    }
  };

  return (
    <div className="settings">
      <h2>Настройки</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Максимальная дневная нагрузка (часов):</label>
          <input
            type="text"
            value={maxDailyHours === 0 ? '' : maxDailyHours.toString()}
            onChange={(e) => {
              const value = e.target.value.trim();
              if (value === '') {
                setMaxDailyHours(0);
              } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= 0) {
                  setMaxDailyHours(numValue);
                }
              }
            }}
            onBlur={(e) => {
              if (e.target.value.trim() === '' || parseFloat(e.target.value) <= 0) {
                setMaxDailyHours(8);
              }
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Выходные дни:</label>
          <div className="weekend-days">
            {DAY_NAMES.map((dayName, index) => (
              <label key={index} className="weekend-day-checkbox">
                <input
                  type="checkbox"
                  checked={weekendDays.includes(index)}
                  onChange={() => toggleWeekendDay(index)}
                />
                <span>{dayName}</span>
              </label>
            ))}
          </div>
        </div>
        <button type="submit">Сохранить</button>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Project } from '../models/types';

interface EditableHoursInputProps {
  value: number;
  projectId: string;
  project: Project;
  date: Date;
  onEdit: (date: Date, projectId: string, hours: number) => void;
}

export function EditableHoursInput({ value, projectId, project, date, onEdit }: EditableHoursInputProps) {
  const [inputValue, setInputValue] = useState(value === 0 ? '' : (value % 1 === 0 ? value.toString() : value.toFixed(1)));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value === 0 ? '' : (value % 1 === 0 ? value.toString() : value.toFixed(1)));
    }
  }, [value, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.trim() === '' || newValue === '0' || newValue === '0.') {
      onEdit(date, projectId, 0);
    } else {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue) && numValue >= 0) {
        // Проверка выполняется в App.tsx
        onEdit(date, projectId, numValue);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditing(true);
    e.target.select();
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (inputValue.trim() === '') {
      onEdit(date, projectId, 0);
    }
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="cell-hours-input"
      onClick={(e) => e.stopPropagation()}
      placeholder="0"
    />
  );
}

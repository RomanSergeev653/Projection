import React, { useState } from 'react';
import { Project } from '../models/types';
import { formatDateInput } from '../utils/dateUtils';
import { getColorForProject } from '../utils/colors';

interface ProjectFormProps {
  onSubmit: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  existingProjectsCount: number;
}

export function ProjectForm({ onSubmit, onCancel, existingProjectsCount }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(formatDateInput(new Date()));
  const [deadline, setDeadline] = useState(formatDateInput(new Date()));
  const [totalHours, setTotalHours] = useState(0);
  const [color, setColor] = useState(getColorForProject(existingProjectsCount));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !startDate || !deadline || totalHours <= 0) {
      alert('Пожалуйста, заполните все поля корректно');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(deadline);

    if (end < start) {
      alert('Дедлайн не может быть раньше даты начала');
      return;
    }

    onSubmit({
      name,
      startDate: start,
      deadline: end,
      totalHours,
      color,
    });
  };

  return (
    <div className="project-form">
      <h2>Создать проект</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Название проекта:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Дата начала:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required

          />
        </div>

        <div className="form-group">
          <label>Дедлайн:</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required

          />
        </div>

        <div className="form-group">
          <label>Всего часов:</label>
          <input
            type="text"
            value={totalHours === 0 ? '' : totalHours.toString()}
            onChange={(e) => {
              const value = e.target.value.trim();
              if (value === '') {
                setTotalHours(0);
              } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= 0) {
                  setTotalHours(numValue);
                }
              }
            }}
            required
          />
        </div>

        <div className="form-group">
          <label>Цвет:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}

          />
        </div>

        <div className="form-actions">
          <button type="submit">Создать</button>
          <button type="button" onClick={onCancel}>Отмена</button>
        </div>
      </form>
    </div>
  );
}

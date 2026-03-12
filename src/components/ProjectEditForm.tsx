import React, { useState, useEffect } from 'react';
import { Project } from '../models/types';
import { formatDateInput } from '../utils/dateUtils';

interface ProjectEditFormProps {
  project: Project;
  onSubmit: (project: Project) => void;
  onCancel: () => void;
}

export function ProjectEditForm({ project, onSubmit, onCancel }: ProjectEditFormProps) {
  const [name, setName] = useState(project.name);
  const [startDate, setStartDate] = useState(formatDateInput(project.startDate));
  const [deadline, setDeadline] = useState(formatDateInput(project.deadline));
  const [totalHours, setTotalHours] = useState(project.totalHours);
  const [color, setColor] = useState(project.color);

  useEffect(() => {
    // Обновляем форму при изменении проекта
    setName(project.name);
    setStartDate(formatDateInput(project.startDate));
    setDeadline(formatDateInput(project.deadline));
    setTotalHours(project.totalHours);
    setColor(project.color);
  }, [project]);

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
      ...project,
      name,
      startDate: start,
      deadline: end,
      totalHours,
      color,
    });
  };

  return (
    <div className="project-form">
      <h2>Редактировать проект</h2>
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
          <button type="submit">Сохранить</button>
          <button type="button" onClick={onCancel}>Отмена</button>
        </div>
      </form>
    </div>
  );
}


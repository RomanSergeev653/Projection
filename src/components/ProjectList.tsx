import React from 'react';
import { Project, DayOverride, AppSettings } from '../models/types';
import { formatDate } from '../utils/dateUtils';
import { checkProjectFeasibility } from '../services/distributionService';

interface ProjectListProps {
  projects: Project[];
  overrides: DayOverride[];
  settings: AppSettings;
  onDelete: (id: string) => void;
  onEdit: (project: Project) => void;
}

export function ProjectList({ projects, overrides, settings, onDelete, onEdit }: ProjectListProps) {
  if (projects.length === 0) {
    return <div className="empty-state">Нет проектов. Создайте первый проект!</div>;
  }

  return (
    <div className="project-list">
      <h2>Проекты</h2>
      <div className="projects-grid">
        {projects.map(project => {
          const feasibility = checkProjectFeasibility(project, overrides, settings.weekendDays);
          
          return (
            <div 
              key={project.id} 
              className={`project-card ${!feasibility.feasible ? 'infeasible' : ''}`}
              style={{ borderLeftColor: project.color }}
            >
              <div className="project-header">
                <h3>{project.name}</h3>
                <div className="project-header-actions">
                  <button
                    className="edit-project-btn"
                    onClick={() => onEdit(project)}
                    title="Редактировать проект"
                  >
                    ✏️
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => {
                      if (confirm(`Удалить проект "${project.name}"?`)) {
                        onDelete(project.id);
                      }
                    }}
                    title="Удалить проект"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="project-info">
                <div>Начало: {formatDate(project.startDate)}</div>
                <div>Дедлайн: {formatDate(project.deadline)}</div>
                <div>Часов: {project.totalHours}</div>
                {!feasibility.feasible && (
                  <div className="project-warning">
                    ⚠️ Недостаточно дней для завершения проекта!
                    <br />
                    Осталось: {feasibility.remainingHours.toFixed(1)}h / Доступно дней: {feasibility.availableDays}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import { Project } from '../models/types';
import { formatDate } from '../utils/dateUtils';
import { differenceInDays, startOfDay, eachDayOfInterval, format, addDays } from 'date-fns';

interface ProjectTimelineProps {
  projects: Project[];
}

export function ProjectTimeline({ projects }: ProjectTimelineProps) {
  if (projects.length === 0) {
    return <div className="empty-state">Нет проектов для отображения</div>;
  }

  const today = startOfDay(new Date());
  const allDates = projects.flatMap(p => [p.startDate, p.deadline]);
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  const timelineStart = minDate < today ? today : minDate;
  const totalDays = differenceInDays(maxDate, timelineStart) + 1;

  // Генерируем метки дат для шкалы - более частые и понятные
  const dateLabels: Date[] = [];
  const numLabels = Math.min(15, Math.max(5, Math.floor(totalDays / 7))); // Примерно по метке на неделю, но не больше 15
  const step = Math.max(1, Math.floor(totalDays / numLabels));
  for (let i = 0; i <= totalDays; i += step) {
    dateLabels.push(addDays(timelineStart, i));
  }
  // Добавляем последний день если его нет
  if (dateLabels.length === 0 || dateLabels[dateLabels.length - 1]?.getTime() !== maxDate.getTime()) {
    dateLabels.push(maxDate);
  }

  return (
    <div className="project-timeline">
      <h2>Timeline проектов</h2>
      <div className="timeline-container">
        <div className="timeline-scale">
          {dateLabels.map((labelDate, idx) => {
            const offset = differenceInDays(labelDate, timelineStart);
            const leftPercent = (offset / totalDays) * 100;
            
            return (
              <div
                key={idx}
                className="timeline-scale-marker"
                style={{ left: `${leftPercent}%` }}
              >
                <div className="timeline-scale-line" />
                <div className="timeline-scale-label">
                  {format(labelDate, 'dd.MM')}
                </div>
              </div>
            );
          })}
        </div>
        {projects.map(project => {
          const projectStart = project.startDate < timelineStart ? timelineStart : project.startDate;
          const startOffset = differenceInDays(projectStart, timelineStart);
          const duration = differenceInDays(project.deadline, projectStart) + 1;
          const leftPercent = (startOffset / totalDays) * 100;
          const widthPercent = (duration / totalDays) * 100;

          return (
            <div key={project.id} className="timeline-row">
              <div className="timeline-label">{project.name}</div>
              <div className="timeline-bar-container">
                <div
                  className="timeline-bar"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: project.color,
                  }}
                  title={`${project.name}: ${formatDate(project.startDate)} - ${formatDate(project.deadline)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

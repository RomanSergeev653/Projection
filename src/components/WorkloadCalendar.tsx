import React, { useState } from 'react';
import { DailyWorkload, Project } from '../models/types';
import { formatDate } from '../utils/dateUtils';
import { isOverloaded } from '../services/distributionService';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isToday, addWeeks, subWeeks, getDay, startOfDay, isBefore } from 'date-fns';
import { EditableHoursInput } from './EditableHoursInput';

interface WorkloadCalendarProps {
  dailyWorkload: DailyWorkload[];
  projects: Project[];
  maxDailyHours: number;
  weekendDays: number[];
  onDayEdit: (date: Date, projectId: string, hours: number) => void;
  onRemoveOverride?: (date: Date, projectId: string) => void;
}

type CalendarView = 'week' | 'month';

export function WorkloadCalendar({
  dailyWorkload,
  projects,
  maxDailyHours,
  weekendDays,
  onDayEdit,
  onRemoveOverride,
}: WorkloadCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  
  if (dailyWorkload.length === 0) {
    return <div className="empty-state">Нет данных для отображения</div>;
  }

  const workloadMap = new Map(
    dailyWorkload.map(d => [format(d.date, 'yyyy-MM-dd'), d])
  );

  const getCalendarDays = () => {
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  };

  const calendarDays = getCalendarDays();
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const getDayWorkload = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return workloadMap.get(dateKey);
  };

  const handlePrev = () => {
    if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const displayDate = view === 'week' 
    ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM yyyy')}`
    : format(currentDate, 'LLLL yyyy');

  return (
    <div className="workload-calendar">
      <div className="calendar-header">
        <h2>Календарь нагрузки</h2>
        <div className="calendar-controls">
          <div className="calendar-view-toggle">
            <button 
              className={view === 'week' ? 'active' : ''}
              onClick={() => setView('week')}
            >
              Неделя
            </button>
            <button 
              className={view === 'month' ? 'active' : ''}
              onClick={() => setView('month')}
            >
              Месяц
            </button>
          </div>
          <div className="calendar-nav">
            <button onClick={handlePrev}>‹</button>
            <span className="calendar-month">
              {displayDate}
            </span>
            <button onClick={handleNext}>›</button>
          </div>
        </div>
      </div>
      
      <div className="calendar-table-wrapper">
        <table className="calendar-table">
          <thead>
            <tr>
              {weekDays.map(day => (
                <th key={day} className="calendar-weekday">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIdx) => (
              <tr key={weekIdx}>
                {week.map(date => {
                  const dayWorkload = getDayWorkload(date);
                  const isCurrentMonth = view === 'month' ? isSameMonth(date, currentDate) : true;
                  const isCurrentDay = isToday(date);
                  const dayOfWeek = getDay(date);
                  const isWeekend = weekendDays.includes(dayOfWeek);
                  const today = startOfDay(new Date());
                  const isPast = isBefore(date, today);
                  const overloaded = dayWorkload ? isOverloaded(dayWorkload, maxDailyHours) : false;
                  
                  return (
                    <td
                      key={date.toISOString()}
                      className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isCurrentDay ? 'today' : ''} ${overloaded ? 'overloaded' : ''} ${isWeekend ? 'weekend' : ''} ${isPast ? 'past-day' : ''}`}
                    >
                      <div className="cell-date">{format(date, 'd')}</div>
                      {dayWorkload && (
                        <div className="cell-content">
                          <div className="cell-total">
                            {dayWorkload.totalHours.toFixed(1)}h
                          </div>
                          <div className="cell-projects">
                            {dayWorkload.projects.map(proj => {
                              const project = projects.find(p => p.id === proj.projectId);
                              if (!project) return null;
                              
                              return (
                                <div key={proj.projectId} className={`cell-project ${proj.isOverride ? 'override' : ''}`}>
                                  <span
                                    className="cell-project-color"
                                    style={{ backgroundColor: proj.color }}
                                  />
                                  <span className="cell-project-name">{proj.projectName}</span>
                                  <div className="cell-input-wrapper">
                                    <EditableHoursInput
                                      value={proj.hours}
                                      projectId={proj.projectId}
                                      project={project}
                                      date={date}
                                      onEdit={onDayEdit}
                                    />
                                    {proj.isOverride && onRemoveOverride && (() => {
                                      const today = startOfDay(new Date());
                                      const isPast = isBefore(date, today);
                                      // Не показываем кнопку удаления для прошедших дней
                                      if (isPast) return null;
                                      
                                      return (
                                        <button
                                          className="cell-remove-override"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveOverride(date, proj.projectId);
                                          }}
                                          title="Отменить редактирование"
                                        >
                                          ×
                                        </button>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

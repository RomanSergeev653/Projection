import React from 'react';
import { DailyWorkload } from '../models/types';
import { formatDate } from '../utils/dateUtils';
import { isOverloaded } from '../services/distributionService';
import { format } from 'date-fns';

interface WorkloadChartProps {
  dailyWorkload: DailyWorkload[];
  maxDailyHours: number;
}

export function WorkloadChart({ dailyWorkload, maxDailyHours }: WorkloadChartProps) {
  if (dailyWorkload.length === 0) {
    return <div className="empty-state">Нет данных для графика</div>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const filteredWorkload = dailyWorkload.filter(day => {
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate >= today;
  });

  if (filteredWorkload.length === 0) {
    return <div className="empty-state">Нет данных для графика (начиная с сегодня)</div>;
  }

  const maxHours = Math.max(
    ...filteredWorkload.map(d => d.totalHours),
    maxDailyHours
  );
  const chartHeight = 400;
  // Позиция лимита от низа контейнера chart-bar-container
  // Столбцы растут снизу вверх, поэтому лимит должен быть на высоте пропорциональной maxDailyHours/maxHours
  const limitLinePosition = maxHours > 0 
    ? (maxDailyHours / maxHours) * chartHeight
    : chartHeight;

  const todayIndex = filteredWorkload.findIndex(d => {
    const dayDate = new Date(d.date);
    dayDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return dayDate.getTime() === todayDate.getTime();
  });

  return (
    <div className="workload-chart">
      <h2>График нагрузки</h2>
      <div className="chart-wrapper">
        <div className="chart-container">
          <div className="chart-bars-wrapper">
            <div className="chart-bars">
              {filteredWorkload.map((day, index) => {
                const totalHeight = (day.totalHours / maxHours) * chartHeight;
                const overloaded = isOverloaded(day, maxDailyHours);
                const normalHeight = overloaded 
                  ? (maxDailyHours / maxHours) * chartHeight
                  : totalHeight;
                const overloadHeight = overloaded 
                  ? totalHeight - normalHeight
                  : 0;
                const isToday = index === todayIndex;
                
                return (
                  <div key={day.date.toISOString()} className={`chart-bar-wrapper ${isToday ? 'today' : ''}`}>
                    <div className="chart-bar-container" style={{ height: `${chartHeight}px` }}>
                      <div
                        className="chart-bar-stacked"
                        style={{ height: `${totalHeight}px` }}
                        title={`${formatDate(day.date)}: ${day.totalHours.toFixed(1)}h`}
                      >
                        {day.projects.map((proj, idx) => {
                          const projHeight = (proj.hours / day.totalHours) * totalHeight;
                          const projOffset = day.projects.slice(0, idx).reduce((sum, p) => 
                            sum + (p.hours / day.totalHours) * totalHeight, 0
                          );
                          
                          return (
                            <div
                              key={proj.projectId}
                              className="chart-bar-segment"
                              style={{
                                height: `${projHeight}px`,
                                bottom: `${projOffset}px`,
                                backgroundColor: proj.color,
                              }}
                              title={`${proj.projectName}: ${proj.hours.toFixed(1)}h`}
                            />
                          );
                        })}
                        {overloaded && (
                          <div
                            className="chart-bar-overload"
                            style={{
                              height: `${overloadHeight}px`,
                              bottom: `${normalHeight}px`,
                              zIndex: 10,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="chart-label">{format(day.date, 'dd.MM')}</div>
                    <div className="chart-value">{day.totalHours.toFixed(1)}h</div>
                  </div>
                );
              })}
            </div>
            <div 
              className="chart-limit-line" 
              style={{ bottom: `${limitLinePosition}px` }}
            >
              <div className="limit-label">Лимит: {maxDailyHours}h</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

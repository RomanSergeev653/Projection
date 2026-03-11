import React, { useState, useEffect } from 'react';
import { Project, DayOverride, AppSettings } from './models/types';
import { ProjectForm } from './components/ProjectForm';
import { ProjectList } from './components/ProjectList';
import { ProjectTimeline } from './components/ProjectTimeline';
import { WorkloadChart } from './components/WorkloadChart';
import { WorkloadCalendar } from './components/WorkloadCalendar';
import { Settings } from './components/Settings';
import {
  loadProjects,
  saveProjects,
  loadOverrides,
  saveOverrides,
  loadSettings,
  saveSettings,
} from './services/storageService';
import { calculateDailyWorkload, distributeProjectHours } from './services/distributionService';
import { eachDayOfInterval, format, getDay, startOfDay, isBefore } from 'date-fns';
import './App.css';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [overrides, setOverrides] = useState<DayOverride[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ maxDailyHours: 8, weekendDays: [0, 6] });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const loadedProjects = loadProjects();
    const loadedOverrides = loadOverrides();
    const loadedSettings = loadSettings();
    
    setProjects(loadedProjects);
    setOverrides(loadedOverrides);
    setSettings(loadedSettings);
    
    const today = startOfDay(new Date());
    const newOverrides: DayOverride[] = [];
    
    // Автоматически создаем override для выходных дней и прошедших дней всех проектов
    loadedProjects.forEach(project => {
      const days = eachDayOfInterval({
        start: project.startDate,
        end: project.deadline,
      });
      
      // Вычисляем текущее распределение для определения значений прошедших дней
      const distribution = distributeProjectHours(project, loadedOverrides, loadedSettings.weekendDays);
      const distributionMap = new Map(
        distribution.map(d => [format(d.date, 'yyyy-MM-dd'), d.hours])
      );
      
      days.forEach(day => {
        const dayOfWeek = getDay(day);
        const isWeekend = loadedSettings.weekendDays.includes(dayOfWeek);
        const isPast = isBefore(day, today);
        const dateKey = format(day, 'yyyy-MM-dd');
        
        // Проверяем, нет ли уже override для этого дня
        const existingOverride = loadedOverrides.find(
          o => o.projectId === project.id && format(o.date, 'yyyy-MM-dd') === dateKey
        );
        
        if (!existingOverride) {
          if (isWeekend) {
            // Выходной день - 0 часов
            newOverrides.push({
              id: crypto.randomUUID(),
              projectId: project.id,
              date: day,
              hours: 0,
            });
          } else if (isPast) {
            // Прошедший день - берем значение из текущего распределения
            const hours = distributionMap.get(dateKey) || 0;
            newOverrides.push({
              id: crypto.randomUUID(),
              projectId: project.id,
              date: day,
              hours: hours,
            });
          }
        }
      });
    });
    
    if (newOverrides.length > 0) {
      const updatedOverrides = [...loadedOverrides, ...newOverrides];
      setOverrides(updatedOverrides);
      saveOverrides(updatedOverrides);
    }
  }, []);

  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    saveProjects(updatedProjects);
    setShowProjectForm(false);
  };

  const handleDeleteProject = (id: string) => {
    const updatedProjects = projects.filter(p => p.id !== id);
    const updatedOverrides = overrides.filter(o => o.projectId !== id);
    setProjects(updatedProjects);
    setOverrides(updatedOverrides);
    saveProjects(updatedProjects);
    saveOverrides(updatedOverrides);
  };

  const handleDayEdit = (date: Date, projectId: string, hours: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Проверка: не превышает ли значение общее количество часов проекта
    if (hours > project.totalHours) {
      alert(`Нельзя установить больше ${project.totalHours} часов для проекта "${project.name}"`);
      return;
    }

    const existingOverride = overrides.find(
      o => o.projectId === projectId && o.date.toDateString() === date.toDateString()
    );

    let updatedOverrides: DayOverride[];
    
    if (existingOverride) {
      if (hours === 0) {
        updatedOverrides = overrides.filter(o => o.id !== existingOverride.id);
      } else {
        updatedOverrides = overrides.map(o =>
          o.id === existingOverride.id ? { ...o, hours } : o
        );
      }
    } else {
      if (hours > 0) {
        const newOverride: DayOverride = {
          id: crypto.randomUUID(),
          projectId,
          date,
          hours,
        };
        updatedOverrides = [...overrides, newOverride];
      } else {
        updatedOverrides = overrides;
      }
    }

    setOverrides(updatedOverrides);
    saveOverrides(updatedOverrides);
  };

  const handleRemoveOverride = (date: Date, projectId: string) => {
    const today = startOfDay(new Date());
    const isPast = isBefore(date, today);
    
    // Нельзя удалить override для прошедших дней
    if (isPast) {
      return;
    }
    
    const updatedOverrides = overrides.filter(
      o => !(o.projectId === projectId && o.date.toDateString() === date.toDateString())
    );
    setOverrides(updatedOverrides);
    saveOverrides(updatedOverrides);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    const oldWeekendDays = settings.weekendDays;
    const newWeekendDays = newSettings.weekendDays;
    
    setSettings(newSettings);
    saveSettings(newSettings);
    
    // Обновляем override для выходных дней при изменении настроек
    let updatedOverrides = [...overrides];
    
    // Удаляем override для дней, которые больше не выходные
    const removedWeekendDays = oldWeekendDays.filter(d => !newWeekendDays.includes(d));
    if (removedWeekendDays.length > 0) {
      updatedOverrides = updatedOverrides.filter(override => {
        const dayOfWeek = getDay(override.date);
        return !removedWeekendDays.includes(dayOfWeek) || override.hours !== 0;
      });
    }
    
    // Добавляем override для новых выходных дней
    const addedWeekendDays = newWeekendDays.filter(d => !oldWeekendDays.includes(d));
    if (addedWeekendDays.length > 0) {
      projects.forEach(project => {
        const days = eachDayOfInterval({
          start: project.startDate,
          end: project.deadline,
        });
        
        days.forEach(day => {
          const dayOfWeek = getDay(day);
          const isNewWeekend = addedWeekendDays.includes(dayOfWeek);
          const dateKey = format(day, 'yyyy-MM-dd');
          
          if (isNewWeekend) {
            const existingOverride = updatedOverrides.find(
              o => o.projectId === project.id && format(o.date, 'yyyy-MM-dd') === dateKey
            );
            
            if (!existingOverride) {
              updatedOverrides.push({
                id: crypto.randomUUID(),
                projectId: project.id,
                date: day,
                hours: 0,
              });
            }
          }
        });
      });
    }
    
    setOverrides(updatedOverrides);
    saveOverrides(updatedOverrides);
    setShowSettings(false);
  };

  const dailyWorkload = calculateDailyWorkload(projects, overrides);

  return (
    <div className="app">
      <header className="app-header">
        <h1>ProjectiON</h1>
        <div className="header-actions">
          <button onClick={() => setShowProjectForm(true)}>+ Создать проект</button>
          <button onClick={() => setShowSettings(true)}>⚙️ Настройки</button>
        </div>
      </header>

      <main className="app-main">
        {showProjectForm && (
          <div className="modal">
            <div className="modal-content">
              <ProjectForm
                onSubmit={handleCreateProject}
                onCancel={() => setShowProjectForm(false)}
                existingProjectsCount={projects.length}
              />
            </div>
          </div>
        )}

        {showSettings && (
          <div className="modal">
            <div className="modal-content">
              <Settings
                settings={settings}
                onSave={handleSaveSettings}
              />
              <button className="close-btn" onClick={() => setShowSettings(false)}>Закрыть</button>
            </div>
          </div>
        )}

        <div className="content-sections">
          <div className="content-section full-screen">
            <ProjectList projects={projects} overrides={overrides} settings={settings} onDelete={handleDeleteProject} />
          </div>

          {projects.length > 0 && (
            <>
              <div className="content-section full-screen">
                <ProjectTimeline projects={projects} />
              </div>

              <div className="content-section full-screen">
                <WorkloadChart
                  dailyWorkload={dailyWorkload}
                  maxDailyHours={settings.maxDailyHours}
                />
              </div>

              <div className="content-section full-screen">
                <WorkloadCalendar
                  dailyWorkload={dailyWorkload}
                  projects={projects}
                  maxDailyHours={settings.maxDailyHours}
                  weekendDays={settings.weekendDays}
                  onDayEdit={handleDayEdit}
                  onRemoveOverride={handleRemoveOverride}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

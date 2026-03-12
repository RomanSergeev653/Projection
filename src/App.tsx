import React, { useState, useEffect } from 'react';
import { Project, DayOverride, AppSettings } from './models/types';
import { ProjectForm } from './components/ProjectForm';
import { ProjectEditForm } from './components/ProjectEditForm';
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
import { importProjectsFromJson, ImportData } from './services/importService';
import { eachDayOfInterval, format, getDay, startOfDay, isBefore } from 'date-fns';
import './App.css';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [overrides, setOverrides] = useState<DayOverride[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ maxDailyHours: 8, weekendDays: [0, 6] });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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
    
    // Создаем override для выходных дней и прошедших дней нового проекта
    const today = startOfDay(new Date());
    const newOverrides: DayOverride[] = [];
    const days = eachDayOfInterval({
      start: newProject.startDate,
      end: newProject.deadline,
    });
    
    // Вычисляем распределение для нового проекта (без override для прошедших дней)
    const distribution = distributeProjectHours(newProject, overrides, settings.weekendDays);
    const distributionMap = new Map(
      distribution.map(d => [format(d.date, 'yyyy-MM-dd'), d.hours])
    );
    
    days.forEach(day => {
      const dayOfWeek = getDay(day);
      const isWeekend = settings.weekendDays.includes(dayOfWeek);
      const isPast = isBefore(day, today);
      const dateKey = format(day, 'yyyy-MM-dd');
      
      // Проверяем, нет ли уже override для этого дня
      const existingOverride = overrides.find(
        o => o.projectId === newProject.id && format(o.date, 'yyyy-MM-dd') === dateKey
      );
      
      if (!existingOverride) {
        if (isWeekend) {
          // Выходной день - 0 часов
          newOverrides.push({
            id: crypto.randomUUID(),
            projectId: newProject.id,
            date: day,
            hours: 0,
          });
        } else if (isPast) {
          // Прошедший день - берем значение из распределения (прошедшие дни участвуют в распределении)
          const hours = distributionMap.get(dateKey) || 0;
          newOverrides.push({
            id: crypto.randomUUID(),
            projectId: newProject.id,
            date: day,
            hours: hours,
          });
        }
      }
    });
    
    if (newOverrides.length > 0) {
      const updatedOverrides = [...overrides, ...newOverrides];
      setOverrides(updatedOverrides);
      saveOverrides(updatedOverrides);
    }
    
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

  const handleUpdateProject = (updatedProject: Project) => {
    const project = projects.find(p => p.id === updatedProject.id);
    if (!project) return;

    const today = startOfDay(new Date());
    const deadlineChanged = updatedProject.deadline.getTime() !== project.deadline.getTime();
    const startDateChanged = updatedProject.startDate.getTime() !== project.startDate.getTime();
    
    // Обновляем проект
    const updatedProjects = projects.map(p =>
      p.id === updatedProject.id ? updatedProject : p
    );
    setProjects(updatedProjects);
    saveProjects(updatedProjects);

    // Если изменился дедлайн или дата начала, удаляем все overrides для этого проекта, кроме:
    // 1. Прошедших дней (isBefore(date, today))
    // 2. Выходных дней (weekendDays)
    if (deadlineChanged || startDateChanged) {
      const updatedOverrides = overrides.filter(override => {
        if (override.projectId !== updatedProject.id) return true; // Оставляем overrides других проектов
        
        const isPast = isBefore(override.date, today);
        const dayOfWeek = getDay(override.date);
        const isWeekend = settings.weekendDays.includes(dayOfWeek);
        
        // Удаляем только если это не прошедший день и не выходной
        return isPast || isWeekend;
      });

      setOverrides(updatedOverrides);
      saveOverrides(updatedOverrides);
    }

    setEditingProject(null);
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
      // Обновляем существующий override (включая 0)
      updatedOverrides = overrides.map(o =>
        o.id === existingOverride.id ? { ...o, hours } : o
      );
    } else {
      // Создаём новый override (включая 0)
      const newOverride: DayOverride = {
        id: crypto.randomUUID(),
        projectId,
        date,
        hours,
      };
      updatedOverrides = [...overrides, newOverride];
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

  const handleImportProjects = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Читаем файл как текст с правильной кодировкой
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text || text.trim() === '') {
            alert('Файл пуст или не может быть прочитан');
            return;
          }

          const importData: ImportData = JSON.parse(text);
          
          if (!importData.status || !importData.response?.tasks) {
            alert('Неверный формат файла. Ожидается JSON с полями status и response.tasks');
            return;
          }

          const updatedProjects = importProjectsFromJson(importData, projects);
          const importedCount = updatedProjects.length - projects.length;
          
          if (importedCount === 0) {
            alert('Нет новых проектов для импорта. Все проекты уже существуют.');
            return;
          }

          setProjects(updatedProjects);
          saveProjects(updatedProjects);
          
          alert(`Успешно импортировано проектов: ${importedCount}`);
        } catch (parseError) {
          console.error('Ошибка парсинга JSON:', parseError);
          alert(`Ошибка при парсинге JSON: ${parseError instanceof Error ? parseError.message : 'Неизвестная ошибка'}`);
        }
      };

      reader.onerror = () => {
        alert('Ошибка при чтении файла');
      };

      reader.readAsText(file, 'UTF-8');
    } catch (error) {
      console.error('Ошибка импорта:', error);
      alert(`Ошибка при импорте файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
    
    // Сбрасываем значение input, чтобы можно было загрузить тот же файл снова
    event.target.value = '';
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
          <label className="import-btn">
            📥 Импорт
            <input
              type="file"
              accept=".json"
              onChange={handleImportProjects}
              style={{ display: 'none' }}
            />
          </label>
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

        {editingProject && (
          <div className="modal">
            <div className="modal-content">
              <ProjectEditForm
                project={editingProject}
                onSubmit={handleUpdateProject}
                onCancel={() => setEditingProject(null)}
              />
            </div>
          </div>
        )}

        <div className="content-sections">
          <div className="content-section full-screen">
            <ProjectList 
              projects={projects} 
              overrides={overrides} 
              settings={settings} 
              onDelete={handleDeleteProject}
              onEdit={(project) => setEditingProject(project)}
            />
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

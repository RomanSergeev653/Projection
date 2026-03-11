import { Project, DayOverride, AppSettings } from '../models/types';

const PROJECTS_KEY = 'pplp_projects';
const OVERRIDES_KEY = 'pplp_overrides';
const SETTINGS_KEY = 'pplp_settings';

function serializeDate(date: Date): string {
  return date.toISOString();
}

function deserializeDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function loadProjects(): Project[] {
  try {
    const data = localStorage.getItem(PROJECTS_KEY);
    if (!data) return [];
    
    const projects = JSON.parse(data);
    return projects.map((p: any) => ({
      ...p,
      startDate: deserializeDate(p.startDate),
      deadline: deserializeDate(p.deadline),
      createdAt: deserializeDate(p.createdAt),
    }));
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  const serialized = projects.map(p => ({
    ...p,
    startDate: serializeDate(p.startDate),
    deadline: serializeDate(p.deadline),
    createdAt: serializeDate(p.createdAt),
  }));
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(serialized));
}

export function loadOverrides(): DayOverride[] {
  try {
    const data = localStorage.getItem(OVERRIDES_KEY);
    if (!data) return [];
    
    const overrides = JSON.parse(data);
    return overrides.map((o: any) => ({
      ...o,
      date: deserializeDate(o.date),
    }));
  } catch {
    return [];
  }
}

export function saveOverrides(overrides: DayOverride[]): void {
  const serialized = overrides.map(o => ({
    ...o,
    date: serializeDate(o.date),
  }));
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(serialized));
}

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return { maxDailyHours: 8, weekendDays: [0, 6] };
    
    const settings = JSON.parse(data);
    // Обеспечиваем обратную совместимость
    if (!settings.weekendDays) {
      settings.weekendDays = [0, 6]; // По умолчанию суббота и воскресенье
    }
    return settings;
  } catch {
    return { maxDailyHours: 8, weekendDays: [0, 6] };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

import { Project } from '../models/types';
import { getColorForProject } from '../utils/colors';

export interface ImportTask {
  id: number;
  title: string;
  created_at: string;
  complete_at: string | null;
  work_time: number | null; // в секундах
}

export interface ImportData {
  status: boolean;
  response: {
    tasks: ImportTask[];
  };
}

/**
 * Конвертирует секунды в часы
 * Если секунд нет или они равны 0, возвращает 1 час по умолчанию
 */
function secondsToHours(seconds: number | null): number {
  if (!seconds || seconds === 0) return 1;
  return seconds / 3600;
}

/**
 * Парсит дату из формата "YYYY-MM-DD HH:mm:ss" или ISO строки
 */
function parseDate(dateStr: string | null): Date {
  if (!dateStr) return new Date();
  
  // Если формат "YYYY-MM-DD HH:mm:ss"
  if (dateStr.includes(' ')) {
    const [datePart] = dateStr.split(' ');
    return new Date(datePart + 'T00:00:00');
  }
  
  return new Date(dateStr);
}

/**
 * Импортирует проекты из JSON данных
 * Если проект с таким id уже существует, корректировки игнорируются (проект не обновляется)
 */
export function importProjectsFromJson(
  importData: ImportData,
  existingProjects: Project[]
): Project[] {
  const existingIds = new Set(existingProjects.map(p => p.id));
  const newProjects: Project[] = [];
  
  importData.response.tasks.forEach(task => {
    const projectId = task.id.toString();
    
    // Если проект с таким id уже существует, пропускаем его
    if (existingIds.has(projectId)) {
      return;
    }
    
    const startDate = parseDate(task.created_at);
    const deadline = parseDate(task.complete_at);
    const totalHours = secondsToHours(task.work_time);
    
    // Пропускаем задачи с некорректными датами
    if (isNaN(startDate.getTime()) || isNaN(deadline.getTime())) {
      return;
    }
    
    // Если дедлайн раньше начала, используем текущую дату как дедлайн
    const finalDeadline = deadline < startDate ? new Date() : deadline;
    
    const project: Project = {
      id: projectId,
      name: task.title,
      startDate,
      deadline: finalDeadline,
      totalHours,
      color: getColorForProject(existingProjects.length + newProjects.length),
      createdAt: new Date(),
    };
    
    newProjects.push(project);
  });
  
  return [...existingProjects, ...newProjects];
}


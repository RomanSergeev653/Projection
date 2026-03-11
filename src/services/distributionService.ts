import { Project, DayOverride, ProjectDistribution, DailyWorkload, AppSettings } from '../models/types';
import { eachDayOfInterval, format, isSameDay, getDay, startOfDay, isBefore } from 'date-fns';

export function distributeProjectHours(
  project: Project,
  overrides: DayOverride[],
  weekendDays: number[] = [0, 6]
): ProjectDistribution[] {
  const days = eachDayOfInterval({
    start: project.startDate,
    end: project.deadline,
  });

  const today = startOfDay(new Date());
  const projectOverrides = overrides.filter(o => o.projectId === project.id);
  const overrideMap = new Map<string, number>();
  
  projectOverrides.forEach(override => {
    const dateKey = format(override.date, 'yyyy-MM-dd');
    overrideMap.set(dateKey, override.hours);
  });

  const fixedHours = projectOverrides.reduce((sum, o) => sum + o.hours, 0);
  const remainingHours = project.totalHours - fixedHours;
  
  const overrideDays = new Set(projectOverrides.map(o => format(o.date, 'yyyy-MM-dd')));
  // Исключаем выходные дни, прошедшие дни и дни с override
  const freeDays = days.filter(day => {
    const dayOfWeek = getDay(day); // 0 = воскресенье, 6 = суббота
    const isWeekend = weekendDays.includes(dayOfWeek);
    const isPast = isBefore(day, today);
    const hasOverride = overrideDays.has(format(day, 'yyyy-MM-dd'));
    return !isWeekend && !isPast && !hasOverride;
  });
  
  const autoHours = freeDays.length > 0 ? remainingHours / freeDays.length : 0;

  return days.map(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayOfWeek = getDay(day);
    const isWeekend = weekendDays.includes(dayOfWeek);
    const isPast = isBefore(day, today);
    const hasOverride = overrideMap.has(dateKey);
    
    // Если это выходной день и нет ручного override, создаем override с 0 часов
    if (isWeekend && !hasOverride) {
      return {
        date: day,
        hours: 0,
        isOverride: true, // Помечаем как override, чтобы не пересчитывалось
      };
    }
    
    // Прошедшие дни всегда должны иметь override (создается автоматически в App.tsx)
    // Если override нет, используем 0 (на случай если день только что стал прошедшим)
    if (isPast && !hasOverride) {
      return {
        date: day,
        hours: 0,
        isOverride: true,
      };
    }
    
    return {
      date: day,
      hours: hasOverride ? overrideMap.get(dateKey)! : autoHours,
      isOverride: hasOverride || isWeekend || isPast,
    };
  });
}

export function calculateDailyWorkload(
  projects: Project[],
  overrides: DayOverride[],
  weekendDays: number[] = [0, 6]
): DailyWorkload[] {
  const workloadMap = new Map<string, DailyWorkload>();

  projects.forEach(project => {
    const distribution = distributeProjectHours(project, overrides, weekendDays);
    
    distribution.forEach(dist => {
      const dateKey = format(dist.date, 'yyyy-MM-dd');
      
      if (!workloadMap.has(dateKey)) {
        workloadMap.set(dateKey, {
          date: dist.date,
          totalHours: 0,
          projects: [],
        });
      }
      
      const dailyWorkload = workloadMap.get(dateKey)!;
      dailyWorkload.totalHours += dist.hours;
      dailyWorkload.projects.push({
        projectId: project.id,
        projectName: project.name,
        hours: dist.hours,
        color: project.color,
        isOverride: dist.isOverride,
      });
    });
  });

  return Array.from(workloadMap.values()).sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  );
}

export function isOverloaded(day: DailyWorkload, maxDailyHours: number): boolean {
  return day.totalHours > maxDailyHours;
}

export function checkProjectFeasibility(
  project: Project,
  overrides: DayOverride[],
  weekendDays: number[] = [0, 6]
): { feasible: boolean; totalOverrideHours: number; remainingHours: number; availableDays: number } {
  const projectOverrides = overrides.filter(o => o.projectId === project.id);
  const totalOverrideHours = projectOverrides.reduce((sum, o) => sum + o.hours, 0);
  const remainingHours = project.totalHours - totalOverrideHours;
  
  const days = eachDayOfInterval({
    start: project.startDate,
    end: project.deadline,
  });
  
  const overrideDays = new Set(projectOverrides.map(o => format(o.date, 'yyyy-MM-dd')));
  // Исключаем выходные дни и дни с override
  const availableDays = days.filter(day => {
    const dayOfWeek = getDay(day);
    const isWeekend = weekendDays.includes(dayOfWeek);
    const hasOverride = overrideDays.has(format(day, 'yyyy-MM-dd'));
    return !isWeekend && !hasOverride;
  }).length;
  
  const feasible = remainingHours >= 0 && (availableDays > 0 || remainingHours === 0);
  
  return {
    feasible,
    totalOverrideHours,
    remainingHours,
    availableDays,
  };
}

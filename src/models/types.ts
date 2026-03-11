export interface Project {
  id: string;
  name: string;
  startDate: Date;
  deadline: Date;
  totalHours: number;
  color: string;
  createdAt: Date;
}

export interface DayOverride {
  id: string;
  projectId: string;
  date: Date;
  hours: number;
}

export interface ProjectDistribution {
  date: Date;
  hours: number;
  isOverride: boolean;
}

export interface DailyWorkload {
  date: Date;
  totalHours: number;
  projects: {
    projectId: string;
    projectName: string;
    hours: number;
    color: string;
    isOverride?: boolean;
  }[];
}

export interface AppSettings {
  maxDailyHours: number;
  weekendDays: number[]; // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
}

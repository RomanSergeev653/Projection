import { format, parse } from 'date-fns';

export function formatDate(date: Date): string {
  return format(date, 'dd.MM.yyyy');
}

export function formatDateInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateInput(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

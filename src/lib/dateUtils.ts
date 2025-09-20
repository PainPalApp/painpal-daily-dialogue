import { startOfDay, endOfDay } from 'date-fns';

/**
 * Get UTC range for local today [start, end) - includes start, excludes end
 * This ensures consistent date filtering across the application
 */
export function getLocalTodayUtcRange(): [Date, Date] {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  
  return [startOfToday, endOfToday];
}

/**
 * Check if a date range represents a single day
 */
export function isSingleDay(startDate: Date, endDate: Date): boolean {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  return start.getTime() === end.getTime();
}

/**
 * Get the number of days between two dates (inclusive)
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}
function startOfYear(year: number): Date {
  return new Date(year, 0, 1);
}

function endOfYear(year: number): Date {
  return new Date(year, 11, 31);
}

function addDays(date: Date, daysAdded: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + daysAdded);
  return newDate;
}

export function daysOfYear(year: number): Date[] {
  const days: Date[] = [];
  let currentDay = startOfYear(year);
  const last = endOfYear(year);
  while (currentDay <= last) {
    days.push(new Date(currentDay));
    currentDay = addDays(currentDay, 1);
  }
  return days;
}

export function formatDayHeader(d: Date): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return fmt.format(d).replace(/\.$/, ""); // enlever les points abrégés (lun. -> lun)
}

export function isWeekend(d: Date): boolean {
  const dow = d.getDay();
  return dow === 0 || dow === 6; // Sun or Sat
}

export function dateToIndex(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffTime = date.getTime() - startOfYear.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function indexToDate(index: number, year: number): Date {
  const startOfYear = new Date(year, 0, 1);
  const newDate = new Date(startOfYear);
  newDate.setDate(newDate.getDate() + index);
  return newDate;
}

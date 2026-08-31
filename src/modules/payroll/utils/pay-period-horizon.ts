type PeriodWithStart = {
  startDate: string;
};

export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function keepCurrentAndOneAhead<T extends PeriodWithStart>(
  periods: T[],
  today = localDateString(),
): T[] {
  const sorted = [...periods].sort((left, right) => left.startDate.localeCompare(right.startDate));
  const currentAndPast = sorted.filter((period) => period.startDate <= today);
  const nextAhead = sorted.find((period) => period.startDate > today);

  return nextAhead ? [...currentAndPast, nextAhead] : currentAndPast;
}

import { ref, watch } from 'vue';

const STORAGE_KEY = 'payroll.report-period';

interface ReportPeriod {
  startDate: string;
  endDate: string;
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const iso = value.trim().replace(/\//g, '-');
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

export function readReportPeriod(): ReportPeriod | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '') as Partial<ReportPeriod>;
    const startDate = normalizeDate(parsed.startDate);
    const endDate = normalizeDate(parsed.endDate);
    if (!startDate || !endDate) return null;
    return { startDate, endDate };
  } catch {
    return null;
  }
}

export function writeReportPeriod(startDate: string, endDate: string): void {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  if (!start || !end) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ startDate: start, endDate: end }));
}

export function sharedReportMonth(): { year: number; month: number } | null {
  const period = readReportPeriod();
  if (!period) return null;
  const [year, month] = period.endDate.split('-').map(Number);
  if (!year || !month) return null;
  return { year, month };
}

export function rememberReportMonth(year: number, month: number): void {
  const paddedMonth = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  writeReportPeriod(
    `${year}-${paddedMonth}-01`,
    `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`,
  );
}

export function useSharedReportDates(
  fallbackStart: () => string,
  fallbackEnd: () => string,
) {
  const stored = readReportPeriod();
  const startDate = ref<string | null>(stored?.startDate ?? fallbackStart());
  const endDate = ref<string | null>(stored?.endDate ?? fallbackEnd());

  watch([startDate, endDate], ([start, end]) => {
    if (start && end) {
      writeReportPeriod(start, end);
    }
  });

  return { startDate, endDate };
}

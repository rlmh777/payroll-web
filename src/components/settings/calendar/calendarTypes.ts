export type CalendarType = 'holiday' | 'vacation' | 'sick' | 'other' | 'timesheet' | 'schedule';

export type FilterOption = {
  label: string;
  value: CalendarType;
};

export type CalendarGroup = {
  id: string;
  key: string;
  name: string;
  color: string;
};

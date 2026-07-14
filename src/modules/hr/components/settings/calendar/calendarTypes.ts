export type CalendarKind = 'work' | 'event';

export type CalendarEventSubtype = 'birthday' | 'holiday';

/** Types stored on calendar rows and shown for leave-derived events. */
export type CalendarType = 'work' | 'birthday' | 'holiday' | 'vacation' | 'sick' | 'other';

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

export function calendarTypeFromKind(
  kind: CalendarKind,
  eventSubtype: CalendarEventSubtype,
): CalendarType {
  return kind === 'work' ? 'work' : eventSubtype;
}

export function kindFromCalendarType(type: CalendarType): CalendarKind {
  return type === 'work' ? 'work' : 'event';
}

export function eventSubtypeFromCalendarType(type: CalendarType): CalendarEventSubtype {
  return type === 'birthday' ? 'birthday' : 'holiday';
}

/**
 * Calendar-date helpers for <input type="date"> values ("YYYY-MM-DD").
 * Arithmetic runs in UTC on the date only, so time zones and DST never shift the day.
 */

export const SPRINT_DURATION_WEEKS = [1, 2, 3, 4] as const;
export type SprintDurationWeeks = (typeof SPRINT_DURATION_WEEKS)[number];
export const DEFAULT_SPRINT_WEEKS: SprintDurationWeeks = 2;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in the user's local time zone (toISOString would give the UTC day). */
export const todayLocal = (now: Date = new Date()): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const isValidDateValue = (value: string): boolean =>
  ISO_DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

export const addDays = (value: string, days: number): string => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * Last day of a sprint that starts on `start` and lasts `weeks` weeks, inclusive:
 * a 2-week sprint starting Monday 2026-11-16 ends Sunday 2026-11-29.
 * Returns '' for an invalid start date.
 */
export const sprintEndDate = (start: string, weeks: number): string =>
  isValidDateValue(start) ? addDays(start, weeks * 7 - 1) : '';

/** True when both dates are valid and end is the same day or after start (ISO strings compare by date). */
export const isEndOnOrAfterStart = (start: string, end: string): boolean =>
  isValidDateValue(start) && isValidDateValue(end) && end >= start;

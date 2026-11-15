import {
  DEFAULT_SPRINT_WEEKS,
  SPRINT_DURATION_WEEKS,
  addDays,
  isEndOnOrAfterStart,
  isValidDateValue,
  sprintEndDate,
  todayLocal,
} from '../src/utils/date-utils';

describe('date-utils', () => {
  it('offers 1 to 4 week sprints with 2 weeks by default', () => {
    expect(SPRINT_DURATION_WEEKS).toEqual([1, 2, 3, 4]);
    expect(DEFAULT_SPRINT_WEEKS).toBe(2);
  });

  it.each([
    ['2026-11-16', 1, '2026-11-22'],
    ['2026-11-16', 2, '2026-11-29'],
    ['2026-11-16', 3, '2026-12-06'],
    ['2026-11-16', 4, '2026-12-13'],
    ['2026-12-21', 2, '2027-01-03'],
    ['2028-02-21', 2, '2028-03-05'],
    ['2026-03-30', 1, '2026-04-05'],
  ])('a sprint starting %s lasting %i week(s) ends on %s (inclusive)', (start, weeks, end) => {
    expect(sprintEndDate(start, weeks)).toBe(end);
  });

  it('returns no end date for an invalid start', () => {
    expect(sprintEndDate('', 2)).toBe('');
    expect(sprintEndDate('2026-02-30', 2)).toBe('');
    expect(sprintEndDate('16/11/2026', 2)).toBe('');
  });

  it('adds days across months and years', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('validates date values', () => {
    expect(isValidDateValue('2026-11-16')).toBe(true);
    expect(isValidDateValue('2028-02-29')).toBe(true);
    expect(isValidDateValue('2026-02-29')).toBe(false);
    expect(isValidDateValue('2026-13-01')).toBe(false);
    expect(isValidDateValue('')).toBe(false);
  });

  it('accepts an end on or after the start only', () => {
    expect(isEndOnOrAfterStart('2026-11-16', '2026-11-29')).toBe(true);
    expect(isEndOnOrAfterStart('2026-11-16', '2026-11-16')).toBe(true);
    expect(isEndOnOrAfterStart('2026-11-16', '2026-11-15')).toBe(false);
    expect(isEndOnOrAfterStart('2026-11-16', '')).toBe(false);
  });

  it('uses the local calendar day for today', () => {
    // 23:30 local on Nov 14 must stay Nov 14 even when UTC is already Nov 15.
    expect(todayLocal(new Date(2026, 10, 14, 23, 30))).toBe('2026-11-14');
    expect(todayLocal(new Date(2026, 0, 5, 8, 0))).toBe('2026-01-05');
  });
});

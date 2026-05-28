import { describe, it, expect } from 'vitest';
import { getColombianHolidays } from '../services/holidayService.js';

describe('getColombianHolidays', () => {
  it('returns an array of holidays for a given year', () => {
    const holidays = getColombianHolidays(2024);
    expect(Array.isArray(holidays)).toBe(true);
    expect(holidays.length).toBeGreaterThan(0);
  });

  it('includes fixed holidays', () => {
    const holidays = getColombianHolidays(2024);
    const dates = holidays.map((h) => h.date);
    expect(dates).toContain('2024-01-01');
    expect(dates).toContain('2024-05-01');
    expect(dates).toContain('2024-07-20');
    expect(dates).toContain('2024-08-07');
    expect(dates).toContain('2024-12-08');
    expect(dates).toContain('2024-12-25');
  });

  it('returns holidays sorted by date', () => {
    const holidays = getColombianHolidays(2024);
    for (let i = 1; i < holidays.length; i++) {
      expect(holidays[i].date >= holidays[i - 1].date).toBe(true);
    }
  });

  it('each holiday has date, name, and type properties', () => {
    const holidays = getColombianHolidays(2024);
    for (const h of holidays) {
      expect(h).toHaveProperty('date');
      expect(h).toHaveProperty('name');
      expect(h).toHaveProperty('type');
    }
  });

  it('includes Easter-based and Emiliani holidays', () => {
    const holidays = getColombianHolidays(2024);
    const types = new Set(holidays.map((h) => h.type));
    expect(types.has('fixed')).toBe(true);
    expect(types.has('easter')).toBe(true);
    expect(types.has('emiliani')).toBe(true);
  });

  it('works for multiple years', () => {
    for (const year of [2023, 2024, 2025, 2026]) {
      const holidays = getColombianHolidays(year);
      expect(holidays.length).toBeGreaterThanOrEqual(18);
    }
  });
});

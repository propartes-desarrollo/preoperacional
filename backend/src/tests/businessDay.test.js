import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock holidayService before importing businessDayService
vi.mock('../services/holidayService.js', () => ({
  getHolidaySet: vi.fn(),
}));

import { getHolidaySet } from '../services/holidayService.js';
import {
  isBusinessDay,
  getNextBusinessDay,
  getPreviousBusinessDay,
  countBusinessDaysBetween,
} from '../services/businessDayService.js';

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no holidays
  getHolidaySet.mockResolvedValue(new Set());
});

describe('isBusinessDay', () => {
  it('returns false for Sunday', async () => {
    // 2024-01-07 is a Sunday
    expect(await isBusinessDay('2024-01-07')).toBe(false);
  });

  it('returns true for a regular Monday', async () => {
    // 2024-01-08 is a Monday
    expect(await isBusinessDay('2024-01-08')).toBe(true);
  });

  it('returns true for Saturday', async () => {
    // 2024-01-06 is a Saturday
    expect(await isBusinessDay('2024-01-06')).toBe(true);
  });

  it('returns false for a holiday (non-Sunday)', async () => {
    // Make 2024-01-08 a holiday
    getHolidaySet.mockResolvedValue(new Set(['2024-01-08']));
    expect(await isBusinessDay('2024-01-08')).toBe(false);
  });
});

describe('getNextBusinessDay', () => {
  it('returns the next day if it is a business day', async () => {
    // 2024-01-08 Monday -> next is 2024-01-09 Tuesday
    expect(await getNextBusinessDay('2024-01-08')).toBe('2024-01-09');
  });

  it('skips Sunday', async () => {
    // 2024-01-06 Saturday -> next business day is 2024-01-08 Monday (skips Sunday 01-07)
    expect(await getNextBusinessDay('2024-01-06')).toBe('2024-01-08');
  });

  it('skips holidays', async () => {
    // Make Monday 2024-01-08 a holiday; from Saturday 01-06 the next bday should be 01-09 Tuesday
    getHolidaySet.mockResolvedValue(new Set(['2024-01-08']));
    expect(await getNextBusinessDay('2024-01-06')).toBe('2024-01-09');
  });
});

describe('getPreviousBusinessDay', () => {
  it('returns the previous day if it is a business day', async () => {
    // 2024-01-09 Tuesday -> prev is 2024-01-08 Monday
    expect(await getPreviousBusinessDay('2024-01-09')).toBe('2024-01-08');
  });

  it('skips Sunday going backwards', async () => {
    // 2024-01-08 Monday -> prev business day is 2024-01-06 Saturday (skips Sunday 01-07)
    expect(await getPreviousBusinessDay('2024-01-08')).toBe('2024-01-06');
  });
});

describe('countBusinessDaysBetween', () => {
  it('counts business days in a range (exclusive start, inclusive end)', async () => {
    // 2024-01-08 (Mon) to 2024-01-13 (Sat): Mon, Tue, Wed, Thu, Fri, Sat = 6 days
    // but start is exclusive, so from 01-09 to 01-13 = Tue, Wed, Thu, Fri, Sat = 5
    expect(await countBusinessDaysBetween('2024-01-08', '2024-01-13')).toBe(5);
  });

  it('returns 0 for same date', async () => {
    expect(await countBusinessDaysBetween('2024-01-08', '2024-01-08')).toBe(0);
  });

  it('excludes holidays from count', async () => {
    // 2024-01-08 Mon to 2024-01-13 Sat; mark Wednesday 01-10 as holiday
    getHolidaySet.mockResolvedValue(new Set(['2024-01-10']));
    // Tue, (Wed holiday), Thu, Fri, Sat = 4
    expect(await countBusinessDaysBetween('2024-01-08', '2024-01-13')).toBe(4);
  });
});

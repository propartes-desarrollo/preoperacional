import { describe, it, expect } from 'vitest';
import { detectVehicleType, normalizePlate } from '../utils/plateDetector.js';

describe('detectVehicleType', () => {
  it('identifies auto plates (3 letters + 3 numbers)', () => {
    expect(detectVehicleType('ABC123')).toBe('auto');
    expect(detectVehicleType('XYZ999')).toBe('auto');
  });

  it('identifies moto plates (3 letters + 2 numbers + 1 letter)', () => {
    expect(detectVehicleType('ABC12D')).toBe('moto');
    expect(detectVehicleType('XYZ99Z')).toBe('moto');
  });

  it('returns null for unrecognized formats', () => {
    expect(detectVehicleType('AB123')).toBeNull();
    expect(detectVehicleType('ABCDEF')).toBeNull();
    expect(detectVehicleType('123456')).toBeNull();
    expect(detectVehicleType('AB12345')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(detectVehicleType('abc123')).toBe('auto');
    expect(detectVehicleType('abc12d')).toBe('moto');
  });

  it('ignores spaces', () => {
    expect(detectVehicleType('ABC 123')).toBe('auto');
    expect(detectVehicleType('ABC 12D')).toBe('moto');
  });
});

describe('normalizePlate', () => {
  it('uppercases and removes spaces', () => {
    expect(normalizePlate('abc123')).toBe('ABC123');
    expect(normalizePlate('abc 12d')).toBe('ABC12D');
    expect(normalizePlate('ABC123')).toBe('ABC123');
  });
});

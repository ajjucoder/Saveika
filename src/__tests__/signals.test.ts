// Tests for signal definitions and helpers

import { describe, it, expect } from 'vitest';
import {
  SCREENING_SIGNALS,
  RESPONSE_OPTIONS,
  SIGNAL_WEIGHTS,
  MAX_WEIGHTED_SUM,
  SIGNAL_KEYS,
  getSignalByKey,
  getResponseOptionByValue,
} from '../lib/signals';

describe('Screening Signals', () => {
  it('should have exactly 8 signals', () => {
    expect(SCREENING_SIGNALS).toHaveLength(8);
  });

  it('should have all required keys', () => {
    const requiredKeys = [
      'sleep', 'appetite', 'withdrawal', 'trauma',
      'activities', 'hopelessness', 'substance', 'self_harm',
    ];
    const actualKeys = SCREENING_SIGNALS.map(s => s.key);
    expect(actualKeys.sort()).toEqual(requiredKeys.sort());
  });

  it('should have both English and Nepali labels', () => {
    SCREENING_SIGNALS.forEach(signal => {
      expect(signal.label_en).toBeTruthy();
      expect(signal.label_ne).toBeTruthy();
      expect(signal.label_en).not.toBe(signal.label_ne);
    });
  });

  it('should have exactly 4 response options (0-3)', () => {
    expect(RESPONSE_OPTIONS).toHaveLength(4);
    const values = RESPONSE_OPTIONS.map(r => r.value);
    expect(values).toEqual([0, 1, 2, 3]);
  });

  it('should have weights for all signals', () => {
    SIGNAL_KEYS.forEach(key => {
      expect(SIGNAL_WEIGHTS[key]).toBeDefined();
      expect(SIGNAL_WEIGHTS[key]).toBeGreaterThan(0);
    });
  });

  it('should weight self_harm highest (5)', () => {
    const selfHarmWeight = SIGNAL_WEIGHTS['self_harm'];
    Object.values(SIGNAL_WEIGHTS).forEach(weight => {
      expect(selfHarmWeight).toBeGreaterThanOrEqual(weight);
    });
    expect(selfHarmWeight).toBe(5);
  });

  it('should weight sleep and appetite lowest (2)', () => {
    expect(SIGNAL_WEIGHTS['sleep']).toBe(2);
    expect(SIGNAL_WEIGHTS['appetite']).toBe(2);
  });

  it('should calculate correct max weighted sum', () => {
    // Max sum = sum of (max_value * weight) for each signal
    // = 3 * sum of all weights
    const sumOfWeights = Object.values(SIGNAL_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(MAX_WEIGHTED_SUM).toBe(3 * sumOfWeights);
  });
});

describe('Signal Helpers', () => {
  it('should get signal by key', () => {
    const signal = getSignalByKey('sleep');
    expect(signal).toBeDefined();
    expect(signal?.key).toBe('sleep');
    expect(signal?.label_en).toBe('Sleep changes');
  });

  it('should return undefined for unknown key', () => {
    const signal = getSignalByKey('unknown');
    expect(signal).toBeUndefined();
  });

  it('should get response option by value', () => {
    const option0 = getResponseOptionByValue(0);
    expect(option0?.label_en).toBe('Not observed');

    const option3 = getResponseOptionByValue(3);
    expect(option3?.label_en).toBe('Severe / persistent');
  });

  it('should return undefined for out-of-range value', () => {
    // @ts-expect-error - Testing invalid input
    const option = getResponseOptionByValue(4);
    expect(option).toBeUndefined();
  });
});

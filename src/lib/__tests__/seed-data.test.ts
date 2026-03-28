import { describe, expect, it } from 'vitest';

import {
  buildDemoHouseholds,
  filterMissingHouseholds,
  mergeDemoUserIds,
} from '../seed-data';

describe('seed-data', () => {
  const areaIds = {
    'Ward 3, Sindhupalchok': 'area-1',
    'Ward 5, Sindhupalchok': 'area-2',
    'Ward 7, Kavrepalanchok': 'area-3',
  } as const;

  const userIds = {
    'chw1@demo.com': 'chw-1',
    'chw2@demo.com': 'chw-2',
    'chw3@demo.com': 'chw-3',
    'supervisor@demo.com': 'sup-1',
  } as const;

  it('builds the fixed CHW1 demo households so the new visit flow has data', () => {
    const households = buildDemoHouseholds(areaIds, userIds);
    const chw1Households = households.filter((household) => household.assigned_chw_id === 'chw-1');

    expect(chw1Households).toHaveLength(5);
    expect(chw1Households.map((household) => household.code)).toEqual([
      'HH-001',
      'HH-002',
      'HH-003',
      'HH-004',
      'HH-005',
    ]);
  });

  it('filters out existing household codes so rerunning the seed only inserts missing demo rows', () => {
    const households = buildDemoHouseholds(areaIds, userIds);

    const missing = filterMissingHouseholds(households, new Set([
      'HH-001',
      'HH-002',
      'HH-003',
    ]));

    expect(missing.map((household) => household.code)).toEqual([
      'HH-004',
      'HH-005',
      'HH-006',
      'HH-007',
      'HH-008',
      'HH-009',
      'HH-010',
      'HH-011',
      'HH-012',
      'HH-013',
      'HH-014',
      'HH-015',
    ]);
  });

  it('falls back to existing profile ids when auth admin creation is unavailable', () => {
    const merged = mergeDemoUserIds(
      {
        'chw1@demo.com': 'profile-chw-1',
        'supervisor@demo.com': 'profile-sup-1',
      },
      {
        'chw2@demo.com': 'auth-chw-2',
      }
    );

    expect(merged).toEqual({
      'chw1@demo.com': 'profile-chw-1',
      'chw2@demo.com': 'auth-chw-2',
      'supervisor@demo.com': 'profile-sup-1',
    });
  });
});

import type { RiskLevel } from './types';

export interface DemoAreaSeed {
  name: string;
  name_ne: string;
  center_lat: number;
  center_lng: number;
}

export interface HouseholdSeedRow {
  code: string;
  head_name: string;
  area_id: string;
  assigned_chw_id: string;
  latest_risk_score: number;
  latest_risk_level: RiskLevel;
  status: 'active' | 'reviewed' | 'referred';
}

export const DEMO_AREAS: DemoAreaSeed[] = [
  { name: 'Ward 3, Sindhupalchok', name_ne: 'वडा ३, सिन्धुपाल्चोक', center_lat: 27.75, center_lng: 85.85 },
  { name: 'Ward 5, Sindhupalchok', name_ne: 'वडा ५, सिन्धुपाल्चोक', center_lat: 27.78, center_lng: 85.88 },
  { name: 'Ward 7, Kavrepalanchok', name_ne: 'वडा ७, काभ्रेपलाञ्चोक', center_lat: 27.55, center_lng: 85.55 },
];

const HOUSEHOLD_HEAD_NAMES = [
  'Thapa',
  'Gurung',
  'Tamang',
  'Sherpa',
  'Rai',
  'Limbu',
  'Magar',
  'Newar',
  'Khadka',
  'Shrestha',
  'Acharya',
  'Poudel',
  'Regmi',
  'Aryal',
  'Basnet',
];

function generateScoreForRiskLevel(riskLevel: RiskLevel): number {
  const scoreRanges: Record<RiskLevel, [number, number]> = {
    low: [0, 25],
    moderate: [26, 50],
    high: [51, 75],
    critical: [76, 100],
  };

  const [min, max] = scoreRanges[riskLevel];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHouseholds(
  areaId: string,
  chwId: string,
  startIndex: number,
  count: number,
  riskDistribution: { low: number; moderate: number; high: number; critical: number }
): HouseholdSeedRow[] {
  const households: HouseholdSeedRow[] = [];
  const riskLevels: RiskLevel[] = [
    ...Array(riskDistribution.low).fill('low' as const),
    ...Array(riskDistribution.moderate).fill('moderate' as const),
    ...Array(riskDistribution.high).fill('high' as const),
    ...Array(riskDistribution.critical).fill('critical' as const),
  ];

  for (let i = 0; i < count; i++) {
    const riskLevel = riskLevels[i] ?? 'low';
    const codeNumber = startIndex + i + 1;

    households.push({
      code: `HH-${String(codeNumber).padStart(3, '0')}`,
      head_name: `${HOUSEHOLD_HEAD_NAMES[i % HOUSEHOLD_HEAD_NAMES.length]} Family`,
      area_id: areaId,
      assigned_chw_id: chwId,
      latest_risk_score: generateScoreForRiskLevel(riskLevel),
      latest_risk_level: riskLevel,
      status: 'active',
    });
  }

  return households;
}

export function buildDemoHouseholds(
  areaIds: Record<string, string>,
  userIds: Record<string, string>
): HouseholdSeedRow[] {
  const households: HouseholdSeedRow[] = [];

  const chw1Id = userIds['chw1@demo.com'];
  if (chw1Id && areaIds['Ward 3, Sindhupalchok']) {
    households.push(
      ...generateHouseholds(areaIds['Ward 3, Sindhupalchok'], chw1Id, 0, 5, {
        low: 1,
        moderate: 2,
        high: 1,
        critical: 1,
      })
    );
  }

  const chw2Id = userIds['chw2@demo.com'];
  if (chw2Id && areaIds['Ward 5, Sindhupalchok']) {
    households.push(
      ...generateHouseholds(areaIds['Ward 5, Sindhupalchok'], chw2Id, 5, 5, {
        low: 3,
        moderate: 1,
        high: 1,
        critical: 0,
      })
    );
  }

  const chw3Id = userIds['chw3@demo.com'];
  if (chw3Id && areaIds['Ward 7, Kavrepalanchok']) {
    households.push(
      ...generateHouseholds(areaIds['Ward 7, Kavrepalanchok'], chw3Id, 10, 5, {
        low: 4,
        moderate: 1,
        high: 0,
        critical: 0,
      })
    );
  }

  return households;
}

export function filterMissingHouseholds(
  households: HouseholdSeedRow[],
  existingCodes: Set<string>
): HouseholdSeedRow[] {
  return households.filter((household) => !existingCodes.has(household.code));
}

export function mergeDemoUserIds(
  existingProfileIds: Record<string, string>,
  authUserIds: Record<string, string>
): Record<string, string> {
  return {
    ...existingProfileIds,
    ...authUserIds,
  };
}

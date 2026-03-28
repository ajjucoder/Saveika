#!/usr/bin/env npx tsx
// Pahad Database Seed Script
// Run via: npx tsx scripts/seed.ts
// Requires SUPABASE_SERVICE_ROLE_KEY env variable

import { createClient } from '@supabase/supabase-js';
import { RISK_THRESHOLDS } from '../src/lib/constants';
import { getFallbackResult } from '../src/lib/scoring';
import type { VisitResponses, RiskLevel } from '../src/lib/types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', url ? 'set' : 'MISSING');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'set' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Demo user definitions
const DEMO_USERS = [
  { email: 'chw1@demo.com', password: 'demo1234', full_name: 'Ram Bahadur', role: 'chw' as const, area_name: 'Ward 3, Sindhupalchok' },
  { email: 'chw2@demo.com', password: 'demo1234', full_name: 'Sita Kumari', role: 'chw' as const, area_name: 'Ward 5, Sindhupalchok' },
  { email: 'chw3@demo.com', password: 'demo1234', full_name: 'Hari Thapa', role: 'chw' as const, area_name: 'Ward 7, Kavrepalanchok' },
  { email: 'supervisor@demo.com', password: 'demo1234', full_name: 'Dr. Sharma', role: 'supervisor' as const, area_name: null },
];

// Area definitions with real Nepal coordinates
const AREAS = [
  { name: 'Ward 3, Sindhupalchok', name_ne: 'वडा ३, सिन्धुपाल्चोक', center_lat: 27.75, center_lng: 85.85 },
  { name: 'Ward 5, Sindhupalchok', name_ne: 'वडा ५, सिन्धुपाल्चोक', center_lat: 27.78, center_lng: 85.88 },
  { name: 'Ward 7, Kavrepalanchok', name_ne: 'वडा ७, काभ्रेपलाञ्चोक', center_lat: 27.55, center_lng: 85.55 },
];

// Generate a score within the correct threshold range for a risk level
function generateScoreForRiskLevel(riskLevel: RiskLevel): number {
  const threshold = RISK_THRESHOLDS[riskLevel];
  return Math.floor(Math.random() * (threshold.max - threshold.min + 1)) + threshold.min;
}

// Generate households with globally unique codes using sequential numbering
// Each CHW gets a contiguous range of codes to ensure uniqueness
function generateHouseholds(
  areaId: string,
  chwId: string,
  startIndex: number, // Starting index to ensure no overlap across CHWs
  count: number,
  riskDistribution: { low: number; moderate: number; high: number; critical: number }
) {
  const households = [];

  const riskLevels: RiskLevel[] = [
    ...Array(riskDistribution.low).fill('low' as RiskLevel),
    ...Array(riskDistribution.moderate).fill('moderate' as RiskLevel),
    ...Array(riskDistribution.high).fill('high' as RiskLevel),
    ...Array(riskDistribution.critical).fill('critical' as RiskLevel),
  ];

  const names = [
    'Thapa', 'Gurung', 'Tamang', 'Sherpa', 'Rai', 'Limbu', 'Magar', 'Newar',
    'Khadka', 'Shrestha', 'Acharya', 'Poudel', 'Regmi', 'Aryal', 'Basnet'
  ];

  for (let i = 0; i < count; i++) {
    const riskLevel = riskLevels[i] || 'low' as RiskLevel;
    // Use correct threshold-based score generation
    const riskScore = generateScoreForRiskLevel(riskLevel);

    // Use a globally unique code with CHW prefix and sequential number
    const codeNumber = startIndex + i + 1;
    households.push({
      code: `HH-${String(codeNumber).padStart(3, '0')}`,
      head_name: `${names[i % names.length]} Family`,
      area_id: areaId,
      assigned_chw_id: chwId,
      latest_risk_score: riskScore,
      latest_risk_level: riskLevel,
      status: riskLevel === 'critical' ? 'active' : riskLevel === 'high' ? 'active' : 'active',
    });
  }

  return households;
}

// Generate sample visit responses based on risk level
// Returns responses that produce a score in the correct threshold range
function generateVisitResponses(riskLevel: RiskLevel): VisitResponses {
  // Get target score from correct threshold
  const targetScore = generateScoreForRiskLevel(riskLevel);

  // Start with base responses
  const responses: VisitResponses = {
    sleep: 0, appetite: 0, activities: 0, hopelessness: 0,
    withdrawal: 0, trauma: 0, fear_flashbacks: 0, psychosis_signs: 0,
    substance: 0, substance_neglect: 0, self_harm: 0, wish_to_die: 0,
  };

  // Calculate target weighted sum from score
  // score = round(weightedSum / 123 * 100) => weightedSum ≈ score * 123 / 100
  const targetWeightedSum = Math.round((targetScore / 100) * 123);

  // Distribute weighted sum across signals
  const signalWeights: Record<keyof VisitResponses, number> = {
    sleep: 2, appetite: 2, activities: 3, hopelessness: 4,
    withdrawal: 3, trauma: 3, fear_flashbacks: 3, psychosis_signs: 4,
    substance: 3, substance_neglect: 3, self_harm: 5, wish_to_die: 6,
  };

  const sortedKeys = Object.keys(signalWeights).sort(
    (a, b) => signalWeights[a as keyof VisitResponses] - signalWeights[b as keyof VisitResponses]
  ) as Array<keyof VisitResponses>;

  let remainingSum = targetWeightedSum;

  for (const key of sortedKeys) {
    if (remainingSum <= 0) break;

    const weight = signalWeights[key];
    const value = Math.min(3, Math.floor(remainingSum / weight));
    responses[key] = value as 0 | 1 | 2 | 3;
    remainingSum -= value * weight;
  }

  // For critical risk, sometimes use override signals
  if (riskLevel === 'critical' && Math.random() < 0.3) {
    if (Math.random() < 0.5) {
      responses.self_harm = 1;
    } else {
      responses.wish_to_die = 1;
    }
  }

  // For high risk, sometimes use psychosis override
  if (riskLevel === 'high' && Math.random() < 0.2) {
    responses.psychosis_signs = 3;
  }

  return responses;
}

// Generate explanations based on risk level
function getExplanations(riskLevel: RiskLevel) {
  const explanations: Record<RiskLevel, { en: string; ne: string }> = {
    low: {
      en: 'No significant warning signs observed. Continue routine monitoring.',
      ne: 'कुनै महत्त्वपूर्ण चेतावनी संकेतहरू देखिएन। नियमित अनुगमन जारी राख्नुहोस्।',
    },
    moderate: {
      en: 'Some warning signs present. Consider follow-up visit within 2 weeks.',
      ne: 'केही चेतावनी संकेतहरू देखिए। २ हप्ताभित्र फलो-अप भ्रमण गर्ने विचार गर्नुहोस्।',
    },
    high: {
      en: 'Multiple significant warning signs observed. Urgent follow-up recommended.',
      ne: 'धेरै महत्त्वपूर्ण चेतावनी संकेतहरू देखिए। अत्यावश्यक फलो-अप सिफारिस गरिएको छ।',
    },
    critical: {
      en: 'Severe warning signs present. Immediate support and referral needed.',
      ne: 'गम्भीर चेतावनी संकेतहरू देखिए। तत्काल समर्थन र रेफरल आवश्यक छ।',
    },
  };

  return explanations[riskLevel];
}

async function seed() {
  console.log('🌱 Starting Pahad database seed...\n');

  // 1. Create areas
  console.log('📍 Creating areas...');
  const { data: areas, error: areasError } = await supabase
    .from('areas')
    .insert(AREAS)
    .select();

  if (areasError) {
    console.error('Failed to create areas:', areasError);
    process.exit(1);
  }
  console.log(`   Created ${areas.length} areas\n`);

  const areaMap = new Map(areas.map(a => [a.name, a.id]));

  // 2. Create users via Supabase Auth Admin API
  console.log('👤 Creating demo users...');
  const userIds: Record<string, string> = {};

  for (const user of DEMO_USERS) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers.users.find(u => u.email === user.email);

    let authUserId: string;

    if (existing) {
      console.log(`   User ${user.email} already exists, skipping...`);
      authUserId = existing.id;
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        console.error(`   Failed to create user ${user.email}:`, authError);
        continue;
      }
      authUserId = authData.user.id;
      console.log(`   Created ${user.email} (${user.role})`);
    }

    userIds[user.email] = authUserId;

    // Create or update profile
    const areaId = user.area_name ? areaMap.get(user.area_name) : null;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authUserId,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        area_id: areaId,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`   Failed to create profile for ${user.email}:`, profileError);
    }
  }
  console.log('');

  // 3. Create households
  console.log('🏠 Creating households...');
  interface HouseholdInsert {
    code: string;
    head_name: string;
    area_id: string;
    assigned_chw_id: string;
    latest_risk_score: number;
    latest_risk_level: string;
    status: string;
  }
  const allHouseholds: HouseholdInsert[] = [];

  // CHW1 gets 5 households in Ward 3 (1 low, 2 moderate, 1 high, 1 critical)
  // Codes: HH-001 to HH-005
  const chw1Id = userIds['chw1@demo.com'];
  if (chw1Id) {
    const area1Id = areaMap.get('Ward 3, Sindhupalchok')!;
    allHouseholds.push(...generateHouseholds(area1Id, chw1Id, 0, 5, { low: 1, moderate: 2, high: 1, critical: 1 }));
  }

  // CHW2 gets 5 households in Ward 5 (3 low, 1 moderate, 1 high)
  // Codes: HH-006 to HH-010
  const chw2Id = userIds['chw2@demo.com'];
  if (chw2Id) {
    const area2Id = areaMap.get('Ward 5, Sindhupalchok')!;
    allHouseholds.push(...generateHouseholds(area2Id, chw2Id, 5, 5, { low: 3, moderate: 1, high: 1, critical: 0 }));
  }

  // CHW3 gets 5 households in Ward 7 (4 low, 1 moderate)
  // Codes: HH-011 to HH-015
  const chw3Id = userIds['chw3@demo.com'];
  if (chw3Id) {
    const area3Id = areaMap.get('Ward 7, Kavrepalanchok')!;
    allHouseholds.push(...generateHouseholds(area3Id, chw3Id, 10, 5, { low: 4, moderate: 1, high: 0, critical: 0 }));
  }

  const { data: households, error: householdsError } = await supabase
    .from('households')
    .insert(allHouseholds)
    .select();

  if (householdsError) {
    console.error('Failed to create households:', householdsError);
    process.exit(1);
  }
  console.log(`   Created ${households.length} households\n`);

  // 4. Create sample visits for each household
  console.log('📋 Creating sample visits...');
  interface VisitInsert {
    household_id: string;
    chw_id: string;
    visit_date: string;
    responses: VisitResponses;
    total_score: number;
    risk_level: RiskLevel;
    explanation_en: string;
    explanation_ne: string;
    notes: string | null;
  }
  const visits: VisitInsert[] = [];

  for (const household of households) {
    // Create 1-2 visits per household
    const visitCount = Math.random() > 0.5 ? 2 : 1;
    const riskLevel = household.latest_risk_level as RiskLevel;

    for (let i = 0; i < visitCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const visitDate = new Date();
      visitDate.setDate(visitDate.getDate() - daysAgo);

      // Generate responses and compute score from them
      const responses = generateVisitResponses(riskLevel);
      const scoringResult = getFallbackResult(responses);
      const explanations = getExplanations(scoringResult.risk_level);

      visits.push({
        household_id: household.id,
        chw_id: household.assigned_chw_id,
        visit_date: visitDate.toISOString().split('T')[0],
        responses,
        total_score: scoringResult.score,  // Computed from responses
        risk_level: scoringResult.risk_level,  // Computed from responses with overrides
        explanation_en: explanations.en,
        explanation_ne: explanations.ne,
        notes: Math.random() > 0.7 ? 'Follow-up recommended during next visit.' : null,
      });
    }
  }

  const { data: insertedVisits, error: visitsError } = await supabase
    .from('visits')
    .insert(visits)
    .select();

  if (visitsError) {
    console.error('Failed to create visits:', visitsError);
    process.exit(1);
  }
  console.log(`   Created ${insertedVisits.length} sample visits\n`);

  // Summary
  console.log('✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Areas: ${areas.length}`);
  console.log(`   Users: ${Object.keys(userIds).length}`);
  console.log(`   Households: ${households.length}`);
  console.log(`   Visits: ${insertedVisits.length}`);
  console.log('\n👤 Demo accounts:');
  DEMO_USERS.forEach(u => {
    console.log(`   ${u.email} / ${u.password} (${u.role})`);
  });
}

seed().catch(console.error);

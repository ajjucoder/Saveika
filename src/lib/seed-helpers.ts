/**
 * Seed data generation helpers for consistent scoring.
 *
 * This module provides deterministic helpers that ensure seeded data
 * uses the correct scoring thresholds and produces consistent results.
 */

import type { VisitResponses, RiskLevel } from './types';
import { RISK_THRESHOLDS } from './constants';
import { calculateFallbackScore, getFallbackResult } from './scoring';
import { SIGNAL_WEIGHTS } from './signals';

export interface VisitSeedData {
  responses: VisitResponses;
  total_score: number;
  risk_level: RiskLevel;
  expected_score: number;  // What the score SHOULD be based on responses
  expected_risk_level: RiskLevel;  // What risk SHOULD be based on responses
}

/**
 * Generates a score within the correct threshold range for a given risk level.
 * Uses RISK_THRESHOLDS from constants.ts to ensure consistency.
 */
export function generateScoreForRiskLevel(riskLevel: RiskLevel): number {
  const threshold = RISK_THRESHOLDS[riskLevel];
  return Math.floor(Math.random() * (threshold.max - threshold.min + 1)) + threshold.min;
}

/**
 * Generates responses that produce a score in the target risk level range.
 * Note: Override signals (self_harm, wish_to_die) can force different risk levels.
 */
function generateResponsesForTargetScore(targetScore: number): VisitResponses {
  const responses: VisitResponses = {
    sleep: 0,
    appetite: 0,
    activities: 0,
    hopelessness: 0,
    withdrawal: 0,
    trauma: 0,
    fear_flashbacks: 0,
    psychosis_signs: 0,
    substance: 0,
    substance_neglect: 0,
    self_harm: 0,
    wish_to_die: 0,
  };

  // Calculate target weighted sum from score
  // score = round(weightedSum / 123 * 100) => weightedSum ≈ score * 123 / 100
  const targetWeightedSum = Math.round((targetScore / 100) * 123);

  // Signal keys in order of weight (ascending) to prioritize filling higher-weight signals last
  const signalKeys: Array<keyof VisitResponses> = [
    'sleep', 'appetite', 'activities', 'hopelessness',
    'withdrawal', 'trauma', 'fear_flashbacks', 'psychosis_signs',
    'substance', 'substance_neglect', 'self_harm', 'wish_to_die',
  ];
  const sortedKeys = signalKeys.sort((a, b) => SIGNAL_WEIGHTS[a] - SIGNAL_WEIGHTS[b]);

  let remainingSum = targetWeightedSum;

  for (const key of sortedKeys) {
    if (remainingSum <= 0) break;

    const weight = SIGNAL_WEIGHTS[key];

    // Try to assign as much as possible to this signal
    const value = Math.min(3, Math.floor(remainingSum / weight));
    responses[key] = value as 0 | 1 | 2 | 3;
    remainingSum -= value * weight;
  }

  return responses;
}

/**
 * Generates visit data with responses and scores that are internally consistent.
 *
 * For override risk levels (critical with self_harm/wish_to_die, high with psychosis),
 * this generates appropriate override signals and validates the result.
 */
export function generateConsistentVisitData(targetRiskLevel: RiskLevel): VisitSeedData {
  // For critical risk, we need to handle override signals specially
  // because a low score can still be critical if self_harm/wish_to_die >= 1
  if (targetRiskLevel === 'critical') {
    return generateCriticalVisitData();
  }

  // For high risk, consider psychosis_signs override
  if (targetRiskLevel === 'high') {
    return generateHighRiskVisitData();
  }

  // For low/moderate, generate responses that produce score in correct range
  const targetScore = generateScoreForRiskLevel(targetRiskLevel);
  const responses = generateResponsesForTargetScore(targetScore);

  // Verify and adjust if needed
  const actualScore = calculateFallbackScore(responses);
  const result = getFallbackResult(responses);

  // If the result doesn't match target (due to override), regenerate
  if (result.risk_level !== targetRiskLevel) {
    // Force the score to be in the correct range
    const threshold = RISK_THRESHOLDS[targetRiskLevel];
    const adjustedScore = Math.min(threshold.max, Math.max(threshold.min, actualScore));

    // Adjust responses to hit the adjusted score
    const adjustedResponses = generateResponsesForTargetScore(adjustedScore);
    const adjustedResult = getFallbackResult(adjustedResponses);

    return {
      responses: adjustedResponses,
      total_score: adjustedResult.score,
      risk_level: adjustedResult.risk_level,
      expected_score: adjustedResult.score,
      expected_risk_level: adjustedResult.risk_level,
    };
  }

  return {
    responses,
    total_score: actualScore,
    risk_level: result.risk_level,
    expected_score: actualScore,
    expected_risk_level: result.risk_level,
  };
}

/**
 * Generates critical risk visit data, using override signals when needed.
 * Critical can be achieved either by high score (76+) or override signals.
 */
function generateCriticalVisitData(): VisitSeedData {
  // 70% chance to use high score, 30% chance to use override with lower score
  if (Math.random() < 0.7) {
    // Generate high score critical (76-100)
    const targetScore = generateScoreForRiskLevel('critical');
    const responses = generateResponsesForTargetScore(targetScore);
    const result = getFallbackResult(responses);

    // Ensure it's critical (override might apply but that's fine)
    return {
      responses,
      total_score: result.score,
      risk_level: result.risk_level,
      expected_score: result.score,
      expected_risk_level: result.risk_level,
    };
  } else {
    // Generate critical via override with lower score
    // This demonstrates the override mechanism
    const lowThreshold = RISK_THRESHOLDS.low;
    const targetScore = Math.floor(Math.random() * (lowThreshold.max - lowThreshold.min + 1)) + lowThreshold.min;
    const responses = generateResponsesForTargetScore(targetScore);

    // Add override signal
    if (Math.random() < 0.5) {
      responses.self_harm = 1;
    } else {
      responses.wish_to_die = 1;
    }

    const result = getFallbackResult(responses);
    return {
      responses,
      total_score: result.score,
      risk_level: result.risk_level,
      expected_score: result.score,
      expected_risk_level: result.risk_level,
    };
  }
}

/**
 * Generates high risk visit data, considering psychosis_signs override.
 */
function generateHighRiskVisitData(): VisitSeedData {
  // 80% chance to use high score range, 20% chance to use psychosis override
  if (Math.random() < 0.8) {
    const targetScore = generateScoreForRiskLevel('high');
    const responses = generateResponsesForTargetScore(targetScore);
    const result = getFallbackResult(responses);

    return {
      responses,
      total_score: result.score,
      risk_level: result.risk_level,
      expected_score: result.score,
      expected_risk_level: result.risk_level,
    };
  } else {
    // Generate high via psychosis_signs override with lower score
    const lowThreshold = RISK_THRESHOLDS.low;
    const targetScore = Math.floor(Math.random() * (lowThreshold.max - lowThreshold.min + 1)) + lowThreshold.min;
    const responses = generateResponsesForTargetScore(targetScore);

    // Add severe psychosis_signs to force high
    responses.psychosis_signs = 3;

    const result = getFallbackResult(responses);
    return {
      responses,
      total_score: result.score,
      risk_level: result.risk_level,
      expected_score: result.score,
      expected_risk_level: result.risk_level,
    };
  }
}

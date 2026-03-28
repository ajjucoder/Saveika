// Scoring logic: Gemini API with deterministic fallback

import { GoogleGenAI } from '@google/genai';
import type { VisitResponses, ScoringResult, RiskLevel } from './types';
import { getRiskLevelFromScore } from './constants';
import { SIGNAL_WEIGHTS, MAX_WEIGHTED_SUM } from './signals';

// 10-second timeout for Gemini API calls (per PRD spec)
export const GEMINI_TIMEOUT_MS = 10000;

// Gemini prompt template
const GEMINI_PROMPT_TEMPLATE = `You are a community mental health screening assistant based on WHO mhGAP guidelines.

A community health worker visited a household and observed the following signals. Each signal is rated: 0 = Not observed, 1 = Mild, 2 = Significant, 3 = Severe.

Signals:
- Sleep changes: {sleep}
- Appetite changes: {appetite}
- Social withdrawal: {withdrawal}
- Recent loss or trauma: {trauma}
- Stopped daily activities: {activities}
- Expressed hopelessness: {hopelessness}
- Alcohol/substance use increase: {substance}
- Self-harm indicators: {self_harm}

Based on these observations, provide:
1. A risk score from 0 to 100
2. A risk level: "low" (0-30), "moderate" (31-60), "high" (61-80), or "critical" (81-100)
3. A plain-language explanation in English (2-3 sentences, non-clinical, suitable for a community health worker)
4. The same explanation in Nepali

Respond ONLY in this exact JSON format:
{
  "score": <number>,
  "risk_level": "<low|moderate|high|critical>",
  "explanation_en": "<string>",
  "explanation_ne": "<string>"
}`;

interface GeminiResponse {
  score: number;
  risk_level: RiskLevel;
  explanation_en: string;
  explanation_ne: string;
}

/**
 * Calculate deterministic fallback score using weighted sum
 * Formula: round((sleep*2 + appetite*2 + withdrawal*3 + trauma*3 + activities*3 + hopelessness*4 + substance*3 + self_harm*5) / 75 * 100)
 */
export function calculateFallbackScore(responses: VisitResponses): number {
  const weightedSum =
    responses.sleep * SIGNAL_WEIGHTS.sleep +
    responses.appetite * SIGNAL_WEIGHTS.appetite +
    responses.withdrawal * SIGNAL_WEIGHTS.withdrawal +
    responses.trauma * SIGNAL_WEIGHTS.trauma +
    responses.activities * SIGNAL_WEIGHTS.activities +
    responses.hopelessness * SIGNAL_WEIGHTS.hopelessness +
    responses.substance * SIGNAL_WEIGHTS.substance +
    responses.self_harm * SIGNAL_WEIGHTS.self_harm;

  const score = Math.round((weightedSum / MAX_WEIGHTED_SUM) * 100);
  return Math.min(100, Math.max(0, score)); // Clamp to 0-100
}

/**
 * Get fallback result when Gemini is unavailable
 */
export function getFallbackResult(responses: VisitResponses): ScoringResult {
  const score = calculateFallbackScore(responses);
  const risk_level = getRiskLevelFromScore(score);

  return {
    score,
    risk_level,
    explanation_en: 'Score calculated using standard screening weights. AI explanation unavailable.',
    explanation_ne: 'मानक स्क्रिनिङ भारका आधारमा स्कोर गणना गरिएको। AI व्याख्या उपलब्ध छैन।',
    scoring_method: 'fallback',
  };
}

/**
 * Call Gemini API for scoring with 10-second timeout
 */
async function callGemini(responses: VisitResponses): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build prompt with actual values
  const prompt = GEMINI_PROMPT_TEMPLATE
    .replace('{sleep}', String(responses.sleep))
    .replace('{appetite}', String(responses.appetite))
    .replace('{withdrawal}', String(responses.withdrawal))
    .replace('{trauma}', String(responses.trauma))
    .replace('{activities}', String(responses.activities))
    .replace('{hopelessness}', String(responses.hopelessness))
    .replace('{substance}', String(responses.substance))
    .replace('{self_harm}', String(responses.self_harm));

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Gemini API timeout after ${GEMINI_TIMEOUT_MS}ms`));
    }, GEMINI_TIMEOUT_MS);
  });

  try {
    // Race the Gemini call against the timeout
    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          temperature: 0,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      }),
      timeoutPromise,
    ]);

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(text) as GeminiResponse;

    // Validate response structure
    if (
      typeof parsed.score !== 'number' ||
      !['low', 'moderate', 'high', 'critical'].includes(parsed.risk_level) ||
      typeof parsed.explanation_en !== 'string' ||
      typeof parsed.explanation_ne !== 'string'
    ) {
      throw new Error('Invalid Gemini response structure');
    }

    // Validate score is in range
    parsed.score = Math.min(100, Math.max(0, Math.round(parsed.score)));

    // Ensure risk level matches score (correct any mismatch)
    const expectedLevel = getRiskLevelFromScore(parsed.score);
    if (parsed.risk_level !== expectedLevel) {
      parsed.risk_level = expectedLevel;
    }

    return parsed;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Main scoring function: Try Gemini, fallback to deterministic on failure
 */
export async function calculateScore(responses: VisitResponses): Promise<ScoringResult> {
  try {
    const geminiResult = await callGemini(responses);
    return {
      ...geminiResult,
      scoring_method: 'gemini',
    };
  } catch (error) {
    console.warn('Gemini scoring failed, using fallback:', error);
    return getFallbackResult(responses);
  }
}

/**
 * Validate that a score matches its risk level
 */
export function validateScoreConsistency(score: number, riskLevel: RiskLevel): boolean {
  const expectedLevel = getRiskLevelFromScore(score);
  return expectedLevel === riskLevel;
}

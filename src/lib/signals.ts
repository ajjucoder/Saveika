// Screening signal definitions with labels in EN and NE

import type { SignalValue } from './types';

export interface SignalDefinition {
  key: string;
  label_en: string;
  label_ne: string;
}

export interface ResponseOption {
  value: SignalValue;
  label_en: string;
  label_ne: string;
}

// The 12 screening signals based on WHO mhGAP-aligned questionnaire guidance
export const SCREENING_SIGNALS: SignalDefinition[] = [
  { key: 'sleep', label_en: 'Sleep changes', label_ne: 'निद्रामा परिवर्तन' },
  { key: 'appetite', label_en: 'Appetite changes', label_ne: 'खानामा परिवर्तन' },
  { key: 'activities', label_en: 'Stopped daily activities', label_ne: 'दैनिक काम बन्द' },
  { key: 'hopelessness', label_en: 'Expressed hopelessness, worthlessness, or sadness', label_ne: 'निराशा वा बेकार महसुस' },
  { key: 'withdrawal', label_en: 'Social withdrawal', label_ne: 'सामाजिक अलगाव' },
  { key: 'trauma', label_en: 'Recent loss or trauma', label_ne: 'हालैको क्षति वा आघात' },
  { key: 'fear_flashbacks', label_en: 'Visible fear, flashbacks, or extreme startle response', label_ne: 'डर वा भयका लक्षण' },
  { key: 'psychosis_signs', label_en: 'Talking to self, strange beliefs, or confused speech', label_ne: 'अनौठो बोली वा व्यवहार' },
  { key: 'substance', label_en: 'Alcohol/substance use increase', label_ne: 'मदिरा/लागुपदार्थ सेवन बढेको' },
  { key: 'substance_neglect', label_en: 'Neglecting family due to substance use', label_ne: 'लागुले गर्दा परिवार बेवास्ता' },
  { key: 'self_harm', label_en: 'Self-harm indicators', label_ne: 'आत्मघाती चोट वा संकेत' },
  { key: 'wish_to_die', label_en: 'Expressed wish to die or not exist', label_ne: 'मर्न चाहेको वा जिउन नचाहेको' },
];

// Response options for each signal (0-3)
export const RESPONSE_OPTIONS: ResponseOption[] = [
  { value: 0, label_en: 'Not observed', label_ne: 'देखिएन' },
  { value: 1, label_en: 'Mild / sometimes', label_ne: 'हल्का / कहिलेकाहीं' },
  { value: 2, label_en: 'Significant / often', label_ne: 'ठूलो / धेरैजसो' },
  { value: 3, label_en: 'Severe / persistent', label_ne: 'गम्भीर / लगातार' },
];

// Signal weights for deterministic fallback scoring
// Based on clinical significance in mental health risk assessment
export const SIGNAL_WEIGHTS: Record<string, number> = {
  sleep: 2,
  appetite: 2,
  activities: 3,
  hopelessness: 4,
  withdrawal: 3,
  trauma: 3,
  fear_flashbacks: 3,
  psychosis_signs: 4,
  substance: 3,
  substance_neglect: 3,
  self_harm: 5,
  wish_to_die: 6,
};

// Maximum possible weighted sum (used for normalization to 0-100)
// (2+2+3+4+3+3+3+4+3+3+5+6) * 3 = 123
export const MAX_WEIGHTED_SUM = 123;

// Get signal definition by key
export function getSignalByKey(key: string): SignalDefinition | undefined {
  return SCREENING_SIGNALS.find((s) => s.key === key);
}

// Get response option by value
export function getResponseOptionByValue(value: SignalValue): ResponseOption | undefined {
  return RESPONSE_OPTIONS.find((r) => r.value === value);
}

// Signal keys in order (for iteration)
export const SIGNAL_KEYS = SCREENING_SIGNALS.map((s) => s.key) as Array<keyof typeof SIGNAL_WEIGHTS>;

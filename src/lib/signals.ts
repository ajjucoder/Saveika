// Screening signal definitions with labels in EN and NE

import type { SignalValue } from './types';

export interface SignalDefinition {
  key: string;
  label_en: string;
  label_ne: string;
  question_ne: string;
}

export interface ResponseOption {
  value: SignalValue;
  label_en: string;
  label_ne: string;
}

// The 12 screening signals based on WHO mhGAP-aligned questionnaire guidance
export const SCREENING_SIGNALS: SignalDefinition[] = [
  {
    key: 'sleep',
    label_en: 'Sleep changes',
    label_ne: 'निद्रामा परिवर्तन',
    question_ne: 'प्र. १: के यस व्यक्तिको निद्रामा परिवर्तन देखिएको छ?',
  },
  {
    key: 'appetite',
    label_en: 'Appetite changes',
    label_ne: 'खानामा परिवर्तन',
    question_ne: 'प्र. २: के यस व्यक्तिले खाना खान छाडेको वा वजन घटेको/बढेको देखिन्छ?',
  },
  {
    key: 'activities',
    label_en: 'Stopped daily activities',
    label_ne: 'दैनिक काम बन्द',
    question_ne: 'प्र. ३: के यस व्यक्तिले दैनिक काम वा घरको काम गर्न छाडेको छ?',
  },
  {
    key: 'hopelessness',
    label_en: 'Expressed hopelessness, worthlessness, or sadness',
    label_ne: 'निराशा वा बेकार महसुस',
    question_ne: 'प्र. ४: के यस व्यक्तिले निराशा, बेकार वा उदासी व्यक्त गरेको छ?',
  },
  {
    key: 'withdrawal',
    label_en: 'Social withdrawal',
    label_ne: 'सामाजिक अलगाव',
    question_ne: 'प्र. ५: के यस व्यक्तिले सामाजिक सम्पर्क घटाएको वा घरभित्रै एक्लै बस्ने गरेको देखिन्छ?',
  },
  {
    key: 'trauma',
    label_en: 'Recent loss or trauma',
    label_ne: 'हालैको क्षति वा आघात',
    question_ne: 'प्र. ६: के यस व्यक्तिले हालसालै कुनै क्षति, विपद, वा मानसिक आघात भोगेको छ?',
  },
  {
    key: 'fear_flashbacks',
    label_en: 'Visible fear, flashbacks, or extreme startle response',
    label_ne: 'डर वा भयका लक्षण',
    question_ne: 'प्र. ७: के यस व्यक्तिमा डर, भयका लक्षण, वा अचानक चम्किने प्रतिक्रिया देखिएको छ?',
  },
  {
    key: 'psychosis_signs',
    label_en: 'Talking to self, strange beliefs, or confused speech',
    label_ne: 'अनौठो बोली वा व्यवहार',
    question_ne: 'प्र. ८: के यस व्यक्तिले आफैसँग कुरा गर्ने, अनौठो विश्वास राख्ने, वा अस्पष्ट बोली बोल्ने गरेको देखिन्छ?',
  },
  {
    key: 'substance',
    label_en: 'Alcohol/substance use increase',
    label_ne: 'मदिरा/लागुपदार्थ सेवन बढेको',
    question_ne: 'प्र. ९: के यस व्यक्तिको मदिरा वा लागु पदार्थ सेवन बढेको देखिन्छ?',
  },
  {
    key: 'substance_neglect',
    label_en: 'Neglecting family due to substance use',
    label_ne: 'लागुले गर्दा परिवार बेवास्ता',
    question_ne: 'प्र. १०: के यस व्यक्तिले मदिरा वा लागु पदार्थका कारण परिवारको हेरचाह गर्न छाडेको देखिन्छ?',
  },
  {
    key: 'self_harm',
    label_en: 'Self-harm indicators',
    label_ne: 'आत्मघाती चोट वा संकेत',
    question_ne: 'प्र. ११: के यस व्यक्तिमा आत्मघाती चोट वा संकेतहरू देखिएका छन्?',
  },
  {
    key: 'wish_to_die',
    label_en: 'Expressed wish to die or not exist',
    label_ne: 'मर्न चाहेको वा जिउन नचाहेको',
    question_ne: 'प्र. १२: के यस व्यक्तिले मर्न चाहेको वा जिउन नचाहेको व्यक्त गरेको छ?',
  },
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

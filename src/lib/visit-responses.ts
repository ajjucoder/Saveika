import type { VisitResponses } from './types';

export const DEFAULT_VISIT_RESPONSES: VisitResponses = {
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

export function normalizeVisitResponses(
  responses: Partial<VisitResponses> | null | undefined
): VisitResponses {
  return {
    ...DEFAULT_VISIT_RESPONSES,
    ...responses,
  };
}

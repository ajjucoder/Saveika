// Tests for request validation schemas

import { describe, it, expect } from 'vitest';
import {
  scoreRequestSchema,
  loginRequestSchema,
  visitResponsesSchema,
  validateOrThrow,
  ValidationError,
} from '../lib/validation';

describe('Request Validation', () => {
  describe('visitResponsesSchema', () => {
    it('should accept valid response values (0-3)', () => {
      const validResponses = {
        sleep: 0, appetite: 1, activities: 0, hopelessness: 1,
        withdrawal: 2, trauma: 3, fear_flashbacks: 1, psychosis_signs: 0,
        substance: 2, substance_neglect: 1, self_harm: 3, wish_to_die: 0,
      };
      const result = visitResponsesSchema.safeParse(validResponses);
      expect(result.success).toBe(true);
    });

    it('should reject values outside 0-3 range', () => {
      const invalidResponses = {
        sleep: 4, appetite: 1, activities: 0, hopelessness: 1,
        withdrawal: 2, trauma: 3, fear_flashbacks: 1, psychosis_signs: 0,
        substance: 2, substance_neglect: 1, self_harm: 3, wish_to_die: 0,
      };
      const result = visitResponsesSchema.safeParse(invalidResponses);
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const incompleteResponses = {
        sleep: 0, appetite: 1, activities: 0, hopelessness: 1,
        withdrawal: 2, trauma: 3, fear_flashbacks: 1, psychosis_signs: 0,
        substance: 2, substance_neglect: 1, self_harm: 3,
        // missing wish_to_die
      };
      const result = visitResponsesSchema.safeParse(incompleteResponses);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer values', () => {
      const invalidResponses = {
        sleep: 1.5, appetite: 1, activities: 0, hopelessness: 1,
        withdrawal: 2, trauma: 3, fear_flashbacks: 1, psychosis_signs: 0,
        substance: 2, substance_neglect: 1, self_harm: 3, wish_to_die: 0,
      };
      const result = visitResponsesSchema.safeParse(invalidResponses);
      expect(result.success).toBe(false);
    });
  });

  describe('scoreRequestSchema', () => {
    it('should accept valid score request', () => {
      const validRequest = {
        household_id: '123e4567-e89b-12d3-a456-426614174000',
        responses: {
          sleep: 0, appetite: 1, activities: 0, hopelessness: 1,
          withdrawal: 2, trauma: 3, fear_flashbacks: 1, psychosis_signs: 0,
          substance: 2, substance_neglect: 1, self_harm: 3, wish_to_die: 0,
        },
        notes: 'Optional notes',
      };
      const result = scoreRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should accept request without notes', () => {
      const validRequest = {
        household_id: '123e4567-e89b-12d3-a456-426614174000',
        responses: {
          sleep: 0, appetite: 1, activities: 0, hopelessness: 1,
          withdrawal: 2, trauma: 3, fear_flashbacks: 1, psychosis_signs: 0,
          substance: 2, substance_neglect: 1, self_harm: 3, wish_to_die: 0,
        },
      };
      const result = scoreRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidRequest = {
        household_id: 'not-a-uuid',
        responses: {
          sleep: 0, appetite: 1, activities: 0, hopelessness: 1,
          withdrawal: 2, trauma: 3, fear_flashbacks: 1, psychosis_signs: 0,
          substance: 2, substance_neglect: 1, self_harm: 3, wish_to_die: 0,
        },
      };
      const result = scoreRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject notes longer than 1000 chars', () => {
      const invalidRequest = {
        household_id: '123e4567-e89b-12d3-a456-426614174000',
        responses: {
          sleep: 0, appetite: 1, activities: 0, hopelessness: 1,
          withdrawal: 2, trauma: 3, fear_flashbacks: 1, psychosis_signs: 0,
          substance: 2, substance_neglect: 1, self_harm: 3, wish_to_die: 0,
        },
        notes: 'x'.repeat(1001),
      };
      const result = scoreRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('loginRequestSchema', () => {
    it('should accept valid login request', () => {
      const validRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = loginRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidRequest = {
        email: 'not-an-email',
        password: 'password123',
      };
      const result = loginRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidRequest = {
        email: 'test@example.com',
        password: 'short',
      };
      const result = loginRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('validateOrThrow', () => {
    it('should return parsed data on valid input', () => {
      const validRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = validateOrThrow(loginRequestSchema, validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should throw ValidationError on invalid input', () => {
      const invalidRequest = {
        email: 'not-an-email',
        password: 'short',
      };
      expect(() => validateOrThrow(loginRequestSchema, invalidRequest)).toThrow(ValidationError);
    });

    it('should include error details in ValidationError', () => {
      const invalidRequest = {
        email: 'not-an-email',
        password: 'short',
      };
      try {
        validateOrThrow(loginRequestSchema, invalidRequest);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.details.length).toBeGreaterThan(0);
        expect(validationError.message).toBe('Validation failed');
      }
    });
  });
});

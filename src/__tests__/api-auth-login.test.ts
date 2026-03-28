// Tests for /api/auth/login route
// Covers: 422 invalid body, 401 auth failure, 200 success with redirect path

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../app/api/auth/login/route';

// Mock auth functions
const mockSignInWithEmail = vi.fn();
const mockGetRedirectPathForRole = vi.fn((role: string) => {
  return role === 'supervisor' ? '/supervisor' : '/app';
});

// Setup mocks
vi.mock('../lib/auth', () => ({
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args),
  getRedirectPathForRole: (role: string) => mockGetRedirectPathForRole(role),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/auth/login', () => {
  const validRequest = {
    email: 'chw@demo.com',
    password: 'demo1234',
  };

  const mockUser = {
    id: 'user-123',
    email: 'chw@demo.com',
  };

  const mockProfile = {
    id: 'user-123',
    email: 'chw@demo.com',
    full_name: 'Test CHW',
    avatar_url: null,
    role: 'chw',
    area_id: 'area-123',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockSupervisorProfile = {
    id: 'user-456',
    email: 'supervisor@demo.com',
    full_name: 'Test Supervisor',
    avatar_url: null,
    role: 'supervisor',
    area_id: null,
    created_at: '2024-01-01T00:00:00Z',
  };

  describe('422 Validation Failure', () => {
    it('should return 422 when email is missing', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should return 422 when password is missing', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when email is invalid format', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when password is too short (less than 6 chars)', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'short',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when request body is empty', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });
  });

  describe('401 Authentication Failure', () => {
    it('should return 401 when credentials are invalid', async () => {
      mockSignInWithEmail.mockResolvedValue({
        success: false,
        error: 'Invalid login credentials',
      });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wrong@email.com',
          password: 'wrongpassword',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid login credentials');
    });

    it('should return 401 when user does not exist', async () => {
      mockSignInWithEmail.mockResolvedValue({
        success: false,
        error: 'User not found',
      });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return 401 when profile is not found after auth', async () => {
      mockSignInWithEmail.mockResolvedValue({
        success: false,
        error: 'Profile not found. Contact your administrator.',
      });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Profile not found. Contact your administrator.');
    });

    it('should return 401 when no user is returned', async () => {
      mockSignInWithEmail.mockResolvedValue({
        success: false,
        error: 'No user returned',
      });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No user returned');
    });
  });

  describe('200 Success', () => {
    it('should return 200 with redirect path for CHW role', async () => {
      mockSignInWithEmail.mockResolvedValue({
        success: true,
        user: mockUser,
        profile: mockProfile,
      });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUser);
      expect(data.profile).toEqual(mockProfile);
      expect(data.redirectPath).toBe('/app');
    });

    it('should return 200 with /supervisor redirect for supervisor role', async () => {
      mockSignInWithEmail.mockResolvedValue({
        success: true,
        user: {
          id: 'user-456',
          email: 'supervisor@demo.com',
        },
        profile: mockSupervisorProfile,
      });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'supervisor@demo.com',
          password: 'demo1234',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.redirectPath).toBe('/supervisor');
    });

    it('should return expected response shape on success', async () => {
      mockSignInWithEmail.mockResolvedValue({
        success: true,
        user: mockUser,
        profile: mockProfile,
      });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('profile');
      expect(data).toHaveProperty('redirectPath');
      expect(data.success).toBe(true);
    });

    it('should call signInWithEmail with correct parameters', async () => {
      mockSignInWithEmail.mockResolvedValue({
        success: true,
        user: mockUser,
        profile: mockProfile,
      });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      await POST(request);

      expect(mockSignInWithEmail).toHaveBeenCalledWith(
        validRequest.email,
        validRequest.password
      );
      expect(mockSignInWithEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSignInWithEmail.mockRejectedValue(new Error('Unexpected error'));

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred');
    });
  });
});

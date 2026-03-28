import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../app/auth/callback/route';

const mockCookieStore = {
  getAll: vi.fn(() => []),
  set: vi.fn(),
};

const mockExchangeCodeForSession = vi.fn();
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();
const mockSingle = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminInsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: mockAdminSingle,
  })),
}));
const mockGetSupabaseAdminClient = vi.fn(() => ({
  from: vi.fn(() => ({
    insert: mockAdminInsert,
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      getUser: mockGetUser,
      signOut: mockSignOut,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
  })),
}));

vi.mock('../lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => mockGetSupabaseAdminClient(),
}));

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');

    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'chw@demo.com',
          user_metadata: {
            full_name: 'Test CHW',
            avatar_url: 'https://example.com/avatar.png',
          },
        },
      },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'No rows found' },
    });
    mockSignOut.mockResolvedValue({ error: null });
    mockAdminSingle.mockResolvedValue({
      data: {
        id: 'user-123',
        email: 'chw@demo.com',
        full_name: 'Test CHW',
        avatar_url: 'https://example.com/avatar.png',
        role: 'chw',
        area_id: null,
        created_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('signs out the OAuth session before redirecting when no profile exists', async () => {
    const response = await GET(new Request('http://localhost/auth/callback?code=test-code'));

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-code');
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockSingle).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/login?error=no_account');
  });

  it('provisions a development profile for localhost Google sign-ins', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const response = await GET(new Request('http://localhost/auth/callback?code=test-code'));

    expect(mockAdminInsert).toHaveBeenCalledWith({
      id: 'user-123',
      email: 'chw@demo.com',
      full_name: 'Test CHW',
      avatar_url: 'https://example.com/avatar.png',
      role: 'chw',
      area_id: null,
    });
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/app');
  });
});

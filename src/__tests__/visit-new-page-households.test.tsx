// Regression test for household loading bug in src/app/app/visit/new/page.tsx
// Bug: page logs "Error fetching households: {}" and shows "Failed to load households"
// because it relies on browser supabase.auth.getUser() instead of the already-loaded
// auth context (useAuth()).
//
// This test should FAIL with the current implementation because the page depends on
// .auth.getUser() which returns no user in our mock. Once the page is fixed to use
// useAuth() / context-driven identity, this test should PASS.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import NewVisitPage from '../app/app/visit/new/page';
import { LanguageProvider } from '../providers/language-provider';
import type { Profile, Household } from '../lib/types';

// ---- Mock next/navigation ----
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// ---- Mock useAuth to return a loaded CHW profile ----
const mockProfile: Profile = {
  id: 'chw-123',
  email: 'chw1@demo.com',
  full_name: 'Test CHW',
  avatar_url: null,
  role: 'chw',
  area_id: 'area-1',
  created_at: '2024-01-01T00:00:00Z',
};

const mockUser = {
  id: 'chw-123',
  email: 'chw1@demo.com',
};

vi.mock('../providers/auth-provider', () => ({
  useAuth: () => ({
    user: mockUser,
    profile: mockProfile,
    role: 'chw',
    session: null,
    loading: false,
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ---- Mock getSupabaseBrowserClient ----
// Key: .auth.getUser() returns NO user (simulating browser auth not being ready),
// but the households query chain can still succeed if called with profile.id

const testHouseholds: Household[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    code: 'HH-001',
    head_name: 'Test Household',
    area_id: 'area-1',
    assigned_chw_id: 'chw-123',
    latest_risk_score: 0,
    latest_risk_level: 'low',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    code: 'HH-002',
    head_name: 'Second Household',
    area_id: 'area-1',
    assigned_chw_id: 'chw-123',
    latest_risk_score: 2,
    latest_risk_level: 'moderate',
    status: 'active',
    created_at: '2024-01-02T00:00:00Z',
  },
];

// Mock chain for households query
const mockOrder = vi.fn(() => Promise.resolve({ data: testHouseholds, error: null }));
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

const mockGetUser = vi.fn();

const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: mockFrom,
};

vi.mock('../lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => mockSupabaseClient,
}));

// ---- Mock lucide-react icons ----
vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader">Loading...</span>,
}));

// ---- Mock language provider ----
vi.mock('../providers/language-provider', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nav.newVisit': 'New Visit',
        'emptyStates.chwHome': 'No households assigned',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ---- Mock VisitForm ----
vi.mock('../components/chw/visit-form', () => ({
  VisitForm: ({ households }: { households: Household[] }) => (
    <div data-testid="visit-form">
      <span data-testid="household-count">{households.length} households</span>
      {households.map((h) => (
        <span key={h.id} data-testid={`household-${h.code}`}>
          {h.code}
        </span>
      ))}
    </div>
  ),
}));

// ---- Helper to render with providers ----
function renderNewVisitPage() {
  return render(
    <LanguageProvider>
      <NewVisitPage />
    </LanguageProvider>
  );
}

describe('NewVisitPage - Household Loading via Auth Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Simulate browser auth not being ready (getUser returns no user)
    // This is the bug scenario: the page relies on getUser() which fails,
    // but it should use the auth context instead
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Reset query chain mocks
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: testHouseholds, error: null });
  });

  it('should load households using auth context (useAuth) when browser auth.getUser() returns no user', async () => {
    // This test should FAIL with current implementation because:
    // 1. Current code calls supabase.auth.getUser() which returns null
    // 2. Current code shows "Not authenticated" error and never queries households
    //
    // After fix:
    // 1. Page should use useAuth() to get profile.id
    // 2. Page should query households with profile.id regardless of getUser() result
    // 3. VisitForm should render with the households

    renderNewVisitPage();

    // Should NOT show loading spinner after initial load
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    // Should NOT show error state
    expect(screen.queryByText('Not authenticated')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed to load households')).not.toBeInTheDocument();

    // Should render VisitForm with households from query
    expect(screen.getByTestId('visit-form')).toBeInTheDocument();
    expect(screen.getByTestId('household-count')).toHaveTextContent('2 households');

    // Verify households were fetched
    expect(screen.getByTestId('household-HH-001')).toBeInTheDocument();
    expect(screen.getByTestId('household-HH-002')).toBeInTheDocument();

    // Verify the query was called (after fix, this should use profile.id from useAuth)
    // Note: Current code won't reach this point, so this assertion will fail
    expect(mockFrom).toHaveBeenCalledWith('households');
  });

  it('should show page title "New Visit" when households are loaded successfully', async () => {
    renderNewVisitPage();

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    // Should show the page title
    expect(screen.getByText('New Visit')).toBeInTheDocument();
  });

  it('should not call supabase.auth.getUser() when useAuth already has loaded profile', async () => {
    // This test verifies the fix: page should NOT rely on getUser()
    // It should use the already-loaded auth context instead

    renderNewVisitPage();

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    // After fix: getUser should NOT be called at all
    // The page should use useAuth() instead
    // With current buggy code, getUser IS called (and returns null, causing the error)
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should query households with the CHW id from auth context profile', async () => {
    renderNewVisitPage();

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    // After fix: the query should use profile.id from useAuth()
    // Current buggy code uses user.id from getUser() which returns null
    expect(mockEq).toHaveBeenCalledWith('assigned_chw_id', mockProfile.id);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../app/api/households/route';

const mockGetAuthenticatedUser = vi.fn();
const mockAdminFrom = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminEq = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminOrder = vi.fn();

const mockAdminClient = {
  from: mockAdminFrom,
};

vi.mock('../lib/supabase/server', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

vi.mock('../lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => mockAdminClient,
}));

describe('GET /api/households', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAdminFrom.mockImplementation((tableName: string) => {
      if (tableName === 'profiles') {
        return {
          select: mockAdminSelect.mockReturnValue({
            eq: mockAdminEq.mockReturnValue({
              single: mockAdminSingle,
            }),
          }),
        };
      }

      // For households table with areas join
      return {
        select: mockAdminSelect.mockReturnValue({
          eq: mockAdminEq.mockReturnValue({
            order: mockAdminOrder,
          }),
        }),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when the user is not authenticated', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 when the user is not a CHW', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'supervisor-1' });
    mockAdminSingle.mockResolvedValue({
      data: { role: 'supervisor' },
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only CHWs can access households');
  });

  it('returns households assigned to the authenticated CHW with area names', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'chw-123' });
    mockAdminSingle.mockResolvedValue({
      data: { role: 'chw' },
      error: null,
    });
    mockAdminOrder.mockResolvedValue({
      data: [
        {
          id: 'household-1',
          code: 'HH-001',
          assigned_chw_id: 'chw-123',
          area_id: 'area-1',
          areas: { name: 'Kathmandu', name_ne: 'काठमाडौं' },
        },
        {
          id: 'household-2',
          code: 'HH-002',
          assigned_chw_id: 'chw-123',
          area_id: 'area-1',
          areas: { name: 'Kathmandu', name_ne: 'काठमाडौं' },
        },
      ],
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.households).toEqual([
      expect.objectContaining({
        code: 'HH-001',
        assigned_chw_id: 'chw-123',
        area_name: 'Kathmandu',
        area_name_ne: 'काठमाडौं',
      }),
      expect.objectContaining({
        code: 'HH-002',
        assigned_chw_id: 'chw-123',
        area_name: 'Kathmandu',
        area_name_ne: 'काठमाडौं',
      }),
    ]);
    expect(mockAdminFrom).toHaveBeenCalledWith('profiles');
    expect(mockAdminFrom).toHaveBeenCalledWith('households');
    expect(mockAdminEq).toHaveBeenCalledWith('assigned_chw_id', 'chw-123');
    expect(mockAdminOrder).toHaveBeenCalledWith('code', { ascending: true });
  });

  it('handles households without area data gracefully', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'chw-123' });
    mockAdminSingle.mockResolvedValue({
      data: { role: 'chw' },
      error: null,
    });
    mockAdminOrder.mockResolvedValue({
      data: [
        {
          id: 'household-1',
          code: 'HH-001',
          assigned_chw_id: 'chw-123',
          area_id: 'area-1',
          areas: null,
        },
      ],
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.households).toHaveLength(1);
    expect(data.households[0].code).toBe('HH-001');
    // Area name fields should not be present when areas is null (undefined is stripped from JSON)
    expect(data.households[0].area_name).toBeUndefined();
    expect(data.households[0].area_name_ne).toBeUndefined();
  });
});

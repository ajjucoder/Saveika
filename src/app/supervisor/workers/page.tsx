import { getSupabaseServerClient } from '@/lib/supabase/server';
import { normalizeRelation } from '@/lib/utils';
import { WorkersClient, type WorkerData } from '@/components/supervisor/workers-client';
import { WorkersHeader } from '@/components/supervisor/workers-header';

export default async function WorkersPage() {
  const supabase = await getSupabaseServerClient();

  // Get start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Fetch all CHWs with their areas
  const { data: chws } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      avatar_url,
      area_id,
      areas ( name, name_ne )
    `)
    .eq('role', 'chw');

  // Fetch visit counts for each CHW this month
  const { data: visits } = await supabase
    .from('visits')
    .select('chw_id, created_at')
    .gte('created_at', startOfMonth.toISOString());

  // Calculate stats per CHW
  const chwStats = new Map<
    string,
    { visitCount: number; lastActive: string | null }
  >();

  if (visits) {
    for (const visit of visits) {
      const existing = chwStats.get(visit.chw_id) || {
        visitCount: 0,
        lastActive: null,
      };
      existing.visitCount++;
      if (
        !existing.lastActive ||
        visit.created_at > existing.lastActive
      ) {
        existing.lastActive = visit.created_at;
      }
      chwStats.set(visit.chw_id, existing);
    }
  }

  // Combine data
  const workersData: WorkerData[] =
    chws?.map((chw) => {
      const stats = chwStats.get(chw.id) || {
        visitCount: 0,
        lastActive: null,
      };
      const area = normalizeRelation(
        chw.areas as { name: string; name_ne: string } | { name: string; name_ne: string }[] | null
      );

      return {
        id: chw.id,
        name: chw.full_name,
        email: chw.email,
        avatar_url: chw.avatar_url,
        area_name: area?.name || 'Unassigned',
        area_name_ne: area?.name_ne || area?.name || 'Unassigned',
        visits_this_month: stats.visitCount,
        last_active: stats.lastActive,
      };
    }) || [];

  // Sort by visit count descending
  workersData.sort((a, b) => b.visits_this_month - a.visits_this_month);

  return (
    <div className="space-y-6">
      <WorkersHeader />
      <WorkersClient workers={workersData} />
    </div>
  );
}

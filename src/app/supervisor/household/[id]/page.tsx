import { getSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { RiskLevel, HouseholdStatus, Visit } from '@/lib/types';
import { HouseholdDetailClient } from './client-page';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  // Fetch household with related data
  const { data: household, error } = await supabase
    .from('households')
    .select(`
      id,
      code,
      head_name,
      latest_risk_score,
      latest_risk_level,
      status,
      area_id,
      assigned_chw_id,
      created_at,
      areas ( id, name, name_ne ),
      profiles!households_assigned_chw_id_fkey ( id, full_name, email )
    `)
    .eq('id', id)
    .single();

  if (error || !household) {
    notFound();
  }

  // Fetch all visits for this household
  const { data: visits } = await supabase
    .from('visits')
    .select(`
      id,
      household_id,
      chw_id,
      visit_date,
      responses,
      total_score,
      risk_level,
      explanation_en,
      explanation_ne,
      notes,
      created_at,
      profiles ( full_name )
    `)
    .eq('household_id', id)
    .order('visit_date', { ascending: false });

  // Serialize data for client component
  const areaData = household.areas as { id: string; name: string; name_ne: string }[] | null;
  const chwData = household.profiles as { id: string; full_name: string; email: string }[] | null;

  const householdData = {
    id: household.id,
    code: household.code,
    head_name: household.head_name,
    latest_risk_score: household.latest_risk_score,
    latest_risk_level: household.latest_risk_level as RiskLevel,
    status: household.status as HouseholdStatus,
    area: areaData?.[0] || null,
    chw: chwData?.[0] || null,
    visits: (visits || []).map((v) => {
      const visitProfile = v.profiles as { full_name: string }[] | null;
      return {
        id: v.id,
        household_id: v.household_id,
        chw_id: v.chw_id,
        visit_date: v.visit_date,
        responses: v.responses as Visit['responses'],
        total_score: v.total_score,
        risk_level: v.risk_level as RiskLevel,
        explanation_en: v.explanation_en,
        explanation_ne: v.explanation_ne,
        notes: v.notes,
        created_at: v.created_at,
        chw_name: visitProfile?.[0]?.full_name || 'Unknown',
      };
    }),
  };

  return <HouseholdDetailClient household={householdData} />;
}

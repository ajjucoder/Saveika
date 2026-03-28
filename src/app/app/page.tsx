'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, CalendarCheck, Home, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/chw/stat-card';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function CHWHomePage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [visitsThisMonth, setVisitsThisMonth] = useState<number>(0);
  const [assignedHouseholds, setAssignedHouseholds] = useState<number>(0);
  const [pendingSyncs, setPendingSyncs] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!profile?.id) return;

      const supabase = getSupabaseBrowserClient();
      
      try {
        // Get visits this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: visitsCount } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('chw_id', profile.id)
          .gte('created_at', startOfMonth.toISOString());

        setVisitsThisMonth(visitsCount || 0);

        // Get assigned households count
        const { count: householdsCount } = await supabase
          .from('households')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_chw_id', profile.id);

        setAssignedHouseholds(householdsCount || 0);

        // Pending syncs is simulated (0 for now since we save immediately)
        setPendingSyncs(0);
      } catch (error) {
        console.error('Error fetching CHW data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = visitsThisMonth > 0 || assignedHouseholds > 0;
  const greeting = profile?.full_name?.split(' ')[0] || t('home.greeting');

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          {t('home.greeting')}, {greeting}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('user.chw')}
        </p>
      </div>

      {/* Empty State */}
      {!hasData && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('emptyStates.chwHome')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title={t('home.visitsThisMonth')}
          value={visitsThisMonth}
          icon={CalendarCheck}
          variant="primary"
        />
        <StatCard
          title={t('home.assignedHouseholds')}
          value={assignedHouseholds}
          icon={Home}
          variant="success"
        />
      </div>

      {/* Pending Syncs (if any) */}
      {pendingSyncs > 0 && (
        <StatCard
          title={t('home.pendingSyncs')}
          value={pendingSyncs}
          icon={RefreshCw}
          variant="warning"
        />
      )}

      {/* Main CTA */}
      <Link href="/app/visit/new">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('home.startNewVisit')}
        </Button>
      </Link>
    </div>
  );
}

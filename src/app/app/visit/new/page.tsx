'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { VisitForm } from '@/components/chw/visit-form';
import { useLanguage } from '@/providers/language-provider';
import { useAuth } from '@/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Household } from '@/lib/types';

export default function NewVisitPage() {
  const { t } = useLanguage();
  const { profile, loading: authLoading } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth context to load
    if (authLoading) {
      return;
    }

    // If auth is loaded but no profile, show error
    if (!profile) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Capture profile.id for use in async function (type narrowing doesn't carry into closures)
    const chwId = profile.id;

    async function fetchHouseholds() {
      const supabase = getSupabaseBrowserClient();

      try {
        const { data, error: fetchError } = await supabase
          .from('households')
          .select('*')
          .eq('assigned_chw_id', chwId)
          .order('code', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setHouseholds(data as Household[]);
      } catch (err) {
        console.error('Error fetching households:', err);
        setError('Failed to load households');
      } finally {
        setLoading(false);
      }
    }

    fetchHouseholds();
  }, [authLoading, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (households.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('emptyStates.chwHome')}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{t('nav.newVisit')}</h1>
      <VisitForm households={households} />
    </div>
  );
}

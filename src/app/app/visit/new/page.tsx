'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { VisitForm } from '@/components/chw/visit-form';
import { useLanguage } from '@/providers/language-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Household } from '@/lib/types';

export default function NewVisitPage() {
  const { t } = useLanguage();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHouseholds() {
      const supabase = getSupabaseBrowserClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('households')
          .select('*')
          .eq('assigned_chw_id', user.id)
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
  }, []);

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

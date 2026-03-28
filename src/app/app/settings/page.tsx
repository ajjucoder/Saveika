'use client';

import { LogOut, User, MapPin, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Area } from '@/lib/types';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const { t, locale } = useLanguage();
  const [area, setArea] = useState<Area | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchArea() {
      if (!profile?.area_id) return;
      
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('areas')
        .select('*')
        .eq('id', profile.area_id)
        .single();

      if (data) {
        setArea(data as Area);
      }
    }

    fetchArea();
  }, [profile?.area_id]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const areaName = area ? (locale === 'ne' ? area.name_ne : area.name) : '—';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t('settings.title')}</h1>

      {/* Language Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageToggle variant="default" />
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('settings.accountInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground text-sm">{t('settings.name')}</span>
            <span className="text-sm font-medium">{profile?.full_name || '—'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground text-sm">{t('settings.email')}</span>
            <span className="text-sm font-medium">{profile?.email || '—'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground text-sm">{t('settings.role')}</span>
            <span className="text-sm font-medium">{t('user.chw')}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground text-sm flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              {t('settings.area')}
            </span>
            <span className="text-sm font-medium">{areaName}</span>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {t('settings.logout')}
      </Button>
    </div>
  );
}

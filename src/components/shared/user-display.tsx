'use client';

import { LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { LanguageToggle } from './language-toggle';
import type { Role } from '@/lib/types';

interface UserDisplayProps {
  className?: string;
  showLanguageToggle?: boolean;
  onSignOut?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRoleLabel(role: Role, t: (key: string) => string): string {
  return t(`user.${role}`);
}

export function UserDisplay({
  className,
  showLanguageToggle = true,
  onSignOut,
}: UserDisplayProps) {
  const { user, profile, signOut, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className ?? ''}`}>
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (!user || !profile) {
    return showLanguageToggle ? (
      <LanguageToggle className={className} />
    ) : null;
  }

  const handleSignOut = async () => {
    await signOut();
    onSignOut?.();
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      {showLanguageToggle && <LanguageToggle variant="compact" />}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile.full_name}</p>
              <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {getRoleLabel(profile.role, t)}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href={`/${profile.role === 'supervisor' ? 'supervisor' : 'app'}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              {t('nav.settings')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {t('nav.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Compact user info for settings pages
interface UserInfoProps {
  className?: string;
}

export function UserInfo({ className }: UserInfoProps) {
  const { profile, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <div className="animate-pulse bg-muted h-24 rounded-lg" />;
  }

  if (!profile) return null;

  return (
    <div className={`flex items-center gap-4 ${className ?? ''}`}>
      <Avatar className="h-16 w-16">
        <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
          {getInitials(profile.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-semibold text-lg">{profile.full_name}</span>
        <span className="text-sm text-muted-foreground">{profile.email}</span>
        <span className="text-xs text-muted-foreground mt-0.5">
          {getRoleLabel(profile.role, t)}
        </span>
      </div>
    </div>
  );
}

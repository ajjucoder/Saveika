'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';

export interface WorkerData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  area_name: string;
  area_name_ne: string;
  visits_this_month: number;
  last_active: string | null;
}

interface WorkersClientProps {
  workers: WorkerData[];
}

export function WorkersClient({ workers }: WorkersClientProps) {
  const { t, locale } = useLanguage();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t('workers.never');
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (workers.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">{t('workers.noActivity')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {t('workers.activeCHWs')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('workers.name')}</TableHead>
                <TableHead>{t('workers.area')}</TableHead>
                <TableHead className="text-center">{t('workers.visitsThisMonth')}</TableHead>
                <TableHead>{t('workers.lastActive')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => {
                const areaName = locale === 'ne' ? worker.area_name_ne : worker.area_name;
                
                return (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={worker.avatar_url || undefined}
                            alt={worker.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {worker.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{worker.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {worker.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {areaName}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">
                        {worker.visits_this_month}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(worker.last_active)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3 px-4">
          {workers.map((worker) => {
            const areaName = locale === 'ne' ? worker.area_name_ne : worker.area_name;
            
            return (
              <div
                key={worker.id}
                className="border rounded-lg p-3"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={worker.avatar_url || undefined}
                      alt={worker.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {worker.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {areaName}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {worker.visits_this_month} {t('workers.visitsThisMonthShort')}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDate(worker.last_active)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

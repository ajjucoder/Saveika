'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/providers/language-provider';
import type { RiskLevel } from '@/lib/types';
import { RISK_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet map (SSR-safe)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export interface AreaMapData {
  id: string;
  name: string;
  name_ne: string;
  center_lat: number;
  center_lng: number;
  household_count: number;
  avg_risk_score: number;
  avg_risk_level: RiskLevel;
}

interface AreaMapProps {
  areas: AreaMapData[];
  loading?: boolean;
}

// Nepal approximate center
const NEPAL_CENTER: [number, number] = [27.7, 85.3];
const NEPAL_ZOOM = 8;

function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#10b981', // emerald-500
    moderate: '#f59e0b', // amber-500
    high: '#f97316', // orange-500
    critical: '#ef4444', // red-500
  };
  return colors[level];
}

function MapContent({ areas }: { areas: AreaMapData[] }) {
  const { locale, t } = useLanguage();

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {areas.map((area) => {
        const name = locale === 'ne' ? area.name_ne : area.name;
        const color = getRiskColor(area.avg_risk_level);
        // Size based on household count (min radius 10, max 30)
        const radius = Math.min(30, Math.max(10, area.household_count * 3));

        return (
          <CircleMarker
            key={area.id}
            center={[area.center_lat, area.center_lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.4,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm min-w-[150px]">
                <p className="font-semibold mb-1">{name}</p>
                <div className="space-y-0.5 text-xs text-gray-600">
                  <p>{t('map.households')}: {area.household_count}</p>
                  <p>{t('map.avgScore')}: {area.avg_risk_score}</p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export function AreaMap({ areas, loading }: AreaMapProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Import Leaflet CSS on mount
    import('leaflet/dist/leaflet.css');
  }, []);

  if (loading || !mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.areaMap')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (areas.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.areaMap')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {t('emptyStates.dashboard')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('dashboard.areaMap')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="h-[300px] w-full rounded-lg overflow-hidden z-0">
          <MapContainer
            center={NEPAL_CENTER}
            zoom={NEPAL_ZOOM}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <MapContent areas={areas} />
          </MapContainer>
        </div>
        {/* Legend */}
        <div className="px-4 pt-3 flex flex-wrap gap-3 text-xs">
          {(['low', 'moderate', 'high', 'critical'] as RiskLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <div
                className={cn('w-3 h-3 rounded-full', RISK_COLORS[level].bg)}
                style={{ backgroundColor: getRiskColor(level) }}
              />
              <span className="text-muted-foreground">{t(`risk.${level}`)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

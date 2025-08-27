"use client";
import { useEffect, useMemo, useState } from 'react';
import { haversineDistanceKm, LatLng } from '@/lib/geo';
import { deriveShiftBadges, formatPay, freshnessLabel } from '@/lib/filters';

export type Job = {
  id?: string;
  title?: string;
  company?: string;
  neighbourhood?: string;
  pay?: string;
  pay_min?: number;
  pay_max?: number;
  currency?: string;
  tips?: boolean;
  shift?: string;
  shift_window?: string;
  hours_band?: string;
  role_type?: string;
  start_date?: string; // ISO
  posted_at?: string;  // ISO
  near_transit?: boolean;
  experience_req?: string;
  training_provided?: boolean;
  lat?: number;
  lng?: number;
  url?: string;
  learning?: string;
};

export type DerivedJob = Job & {
  id: string;
  coords?: LatLng;
  distanceKm?: number;
  postedAt?: number | null;
  freshnessDays?: number | null;
  freshnessLabel?: string | null;
  shiftBadges: string[];
  payDisplay: string | null;
};

export function useJobs() {
  const [jobs, setJobs] = useState<DerivedJob[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    fetch('/data/jobs.json')
      .then(r => r.json())
      .then((rows: Job[]) => {
        const mapped = rows.map((j, idx) => {
          const postedAt = j.posted_at ? Date.parse(j.posted_at) : null;
          const now = Date.now();
          const days = postedAt != null ? Math.floor((now - postedAt) / 86400000) : null;
          const shiftBadges = deriveShiftBadges(j.shift, j.shift_window);
          const payDisplay = formatPay(j as any);
          const id = j.id ?? `job-${idx}`;
          return {
            ...j,
            id,
            coords: j.lat != null && j.lng != null ? { lat: j.lat, lng: j.lng } : undefined,
            postedAt,
            freshnessDays: days,
            freshnessLabel: days != null ? freshnessLabel(days) : null,
            shiftBadges,
            payDisplay,
          } as DerivedJob;
        });
        setJobs(mapped);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const withDistances = useMemo(() => {
    if (!userLocation) return jobs;
    return jobs.map(j => {
      if (j.lat == null || j.lng == null) return j;
      const d = haversineDistanceKm(userLocation, { lat: j.lat, lng: j.lng });
      return { ...j, distanceKm: d } as DerivedJob;
    });
  }, [jobs, userLocation]);

  return { jobs: withDistances, isLoading, error, userLocation };
}



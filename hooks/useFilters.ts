"use client";
import { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { isFreshWithinHours, sortByClosest, sortByHighestPay, sortByNewest } from '@/lib/filters';
import type { DerivedJob } from '@/hooks/useJobs';
import type { LatLng } from '@/lib/geo';

export type FiltersState = {
  quick: {
    nearMe: boolean;
    pay18: boolean;
    sameDay: boolean;
    noExp: boolean;
    nearTransit: boolean;
    payListed: boolean;
  };
  advanced: {
    neighbourhoods?: string[];
    roleTypes?: string[];
    shifts?: string[];
    hoursBand?: string;
    tips?: boolean;
    trainingProvided?: boolean;
    overtimePossible?: boolean;
    startDate?: 'today' | '7days' | 'month';
    includeOlder?: boolean;
  };
  sort: 'newest' | 'closest' | 'highestPay';
  applyAll: (jobs: DerivedJob[], user: LatLng | null) => DerivedJob[];
  applySort: (jobs: DerivedJob[], user: LatLng | null) => DerivedJob[];
};

const DEFAULTS: FiltersState = {
  quick: { nearMe: false, pay18: false, sameDay: false, noExp: false, nearTransit: false, payListed: false },
  advanced: { includeOlder: false },
  sort: 'newest',
  applyAll: () => [],
  applySort: () => [],
};

export function useFilters() {
  const params = useSearchParams();
  const router = useRouter();

  const state = useMemo<FiltersState>(() => {
    const q = (key: string) => params.get(key);
    const parseBool = (v: string | null) => v === '1';
    const parseCSV = (v: string | null) => v ? v.split(',').map(s => decodeURIComponent(s)) : [];

    const quick = {
      nearMe: parseBool(q('near')),
      pay18: parseBool(q('pay18')),
      sameDay: parseBool(q('sam')),
      noExp: parseBool(q('noexp')),
      nearTransit: parseBool(q('transit')),
      payListed: parseBool(q('paylist')),
    };
    const advanced = {
      neighbourhoods: parseCSV(q('n')),
      roleTypes: parseCSV(q('rt')),
      shifts: parseCSV(q('sh')),
      hoursBand: q('hb') ?? undefined,
      tips: parseBool(q('tips')) || undefined,
      trainingProvided: parseBool(q('train')) || undefined,
      overtimePossible: parseBool(q('ot')) || undefined,
      startDate: (q('sd') as any) ?? undefined,
      includeOlder: parseBool(q('older')),
    };
    const sort = (q('sort') as FiltersState['sort']) || 'newest';

    function applyAll(jobs: DerivedJob[], user: LatLng | null) {
      const today = new Date();
      const sameDayCut = new Date();
      sameDayCut.setDate(today.getDate() + 1);

      return jobs.filter(j => {
        if (!advanced.includeOlder && !isFreshWithinHours(j, 72)) return false;
        if (quick.nearMe && (j.distanceKm == null || j.distanceKm > 3)) return false;
        if (quick.pay18) {
          const payMax = j.pay_max ?? j.pay_min ?? 0;
          if (payMax < 18) return false;
        }
        if (quick.sameDay) {
          const sd = j.start_date ? Date.parse(j.start_date) : null;
          if (sd == null || sd > sameDayCut.getTime()) return false;
        }
        if (quick.noExp && j.experience_req && j.experience_req !== 'None' && j.experience_req.trim() !== '') return false;
        if (quick.nearTransit && !j.near_transit) return false;
        if (quick.payListed && !((j.pay_min != null) || (j.pay != null))) return false;

        if (advanced.neighbourhoods && advanced.neighbourhoods.length > 0) {
          if (!j.neighbourhood || !advanced.neighbourhoods.includes(j.neighbourhood)) return false;
        }
        if (advanced.roleTypes && advanced.roleTypes.length > 0) {
          if (!j.role_type || !advanced.roleTypes.includes(j.role_type)) return false;
        }
        if (advanced.shifts && advanced.shifts.length > 0) {
          if (!j.shiftBadges.some(s => advanced.shifts!.includes(s))) return false;
        }
        if (advanced.hoursBand) {
          if (j.hours_band !== advanced.hoursBand) return false;
        }
        if (advanced.tips && !j.tips) return false;
        if (advanced.trainingProvided && !j.training_provided) return false;
        if (advanced.overtimePossible && !(j as any).overtime_possible) return false;
        if (advanced.startDate) {
          const sd = j.start_date ? Date.parse(j.start_date) : null;
          if (sd == null) return false;
          const date = new Date(sd);
          if (advanced.startDate === 'today') {
            const todayStr = new Date().toDateString();
            if (date.toDateString() !== todayStr) return false;
          } else if (advanced.startDate === '7days') {
            const limit = new Date(); limit.setDate(limit.getDate() + 7);
            if (date > limit) return false;
          } else if (advanced.startDate === 'month') {
            const limit = new Date(); limit.setMonth(limit.getMonth() + 1);
            if (date > limit) return false;
          }
        }
        return true;
      });
    }

    function applySort(jobs: DerivedJob[], user: LatLng | null) {
      const copy = [...jobs];
      if (sort === 'newest') return copy.sort(sortByNewest);
      if (sort === 'highestPay') return copy.sort(sortByHighestPay);
      return copy.sort((a, b) => sortByClosest(a, b, user));
    }

    return { quick, advanced, sort, applyAll, applySort } as FiltersState;
  }, [params]);

  function updateParams(next: Partial<{ [k: string]: string | null }>) {
    const existing = new URLSearchParams(Array.from(params.entries()));
    Object.entries(next).forEach(([k, v]) => {
      if (v == null || v === '0' || v === '') existing.delete(k); else existing.set(k, v);
    });
    const qs = existing.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }

  function setQuickToggle(key: keyof FiltersState['quick'], value: boolean) {
    const map: Record<string, string> = { nearMe: 'near', pay18: 'pay18', sameDay: 'sam', noExp: 'noexp', nearTransit: 'transit', payListed: 'paylist' };
    updateParams({ [map[key]]: value ? '1' : null });
  }
  function setAdvanced(next: Partial<FiltersState['advanced']>) {
    const m = new Map<string, string>();
    if (next.neighbourhoods) m.set('n', next.neighbourhoods.map(encodeURIComponent).join(','));
    if (next.roleTypes) m.set('rt', next.roleTypes.map(encodeURIComponent).join(','));
    if (next.shifts) m.set('sh', next.shifts.map(encodeURIComponent).join(','));
    if (next.hoursBand !== undefined) m.set('hb', next.hoursBand ?? '');
    if (next.tips !== undefined) m.set('tips', next.tips ? '1' : '');
    if (next.trainingProvided !== undefined) m.set('train', next.trainingProvided ? '1' : '');
    if (next.overtimePossible !== undefined) m.set('ot', next.overtimePossible ? '1' : '');
    if (next.startDate !== undefined) m.set('sd', next.startDate ?? '');
    if (next.includeOlder !== undefined) m.set('older', next.includeOlder ? '1' : '');
    const obj: any = {}; m.forEach((v, k) => obj[k] = v);
    updateParams(obj);
  }
  function setSort(sort: FiltersState['sort']) { updateParams({ sort }); }

  return { state, setQuickToggle, setAdvanced, setSort, includeOlder: state.advanced.includeOlder } as const;
}



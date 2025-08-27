import type { DerivedJob } from '@/hooks/useJobs';
import type { LatLng } from '@/lib/geo';
import { TORONTO_CENTER } from '@/lib/geo';

export function isFreshWithinHours(job: DerivedJob, hours = 72) {
  if (job.postedAt == null) return false;
  const now = Date.now();
  const diffHours = (now - job.postedAt) / 36e5;
  return diffHours <= hours;
}

export function computePayMin(job: DerivedJob): number | null {
  if (typeof job.pay_min === 'number') return job.pay_min;
  if (typeof job.pay_max === 'number') return job.pay_max;
  return null;
}

export function computePayMax(job: DerivedJob): number | null {
  if (typeof job.pay_max === 'number') return job.pay_max;
  if (typeof job.pay_min === 'number') return job.pay_min;
  return null;
}

export function deriveShiftBadges(shift?: string | null, shift_window?: string | null): string[] {
  const badges = new Set<string>();
  const s = `${shift ?? ''} ${shift_window ?? ''}`.toLowerCase();
  if (/morning|6|07|08|09|10|11/.test(s)) badges.add('Morning');
  if (/afternoon|12|13|14|15|16/.test(s)) badges.add('Afternoon');
  if (/evening|17|18|19|20|21|22/.test(s)) badges.add('Evening');
  if (/overnight|23|00|01|02|03|04|05|06/.test(s)) badges.add('Overnight');
  return Array.from(badges);
}

export function formatPay(job: DerivedJob): string | null {
  if (job.pay) return job.pay;
  const min = computePayMin(job);
  const max = computePayMax(job);
  if (min == null && max == null) return null;
  const currency = job.currency ?? '$';
  const range = min != null && max != null && max !== min ? `${currency}${min}–${max}` : `${currency}${min ?? max}`;
  return `${range}/hr${job.tips ? ' + tips' : ''}`;
}

export function freshnessLabel(days: number | null): string | null {
  if (days == null) return null;
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  return `Posted ${days} days ago`;
}

export function sortByNewest(a: DerivedJob, b: DerivedJob) {
  return (b.postedAt ?? 0) - (a.postedAt ?? 0);
}

export function sortByHighestPay(a: DerivedJob, b: DerivedJob) {
  const ax = computePayMax(a) ?? 0;
  const bx = computePayMax(b) ?? 0;
  if (bx !== ax) return bx - ax;
  const an = computePayMin(a) ?? 0;
  const bn = computePayMin(b) ?? 0;
  return bn - an;
}

export function sortByClosest(a: DerivedJob, b: DerivedJob, user: LatLng | null) {
  // Use precomputed distance when available; otherwise fallback to distance from Toronto center
  const ad = a.distanceKm ?? distanceFromCenter(a);
  const bd = b.distanceKm ?? distanceFromCenter(b);
  return ad - bd;
}

function distanceFromCenter(j: DerivedJob): number {
  if (j.lat == null || j.lng == null) return 9999;
  const dx = Math.abs(j.lat - TORONTO_CENTER.lat);
  const dy = Math.abs(j.lng - TORONTO_CENTER.lng);
  return Math.hypot(dx, dy);
}



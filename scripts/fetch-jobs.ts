/* Minimal, compliant ingestion script (skeleton matching your spec). */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

type Job = {
  id: string;
  title: string;
  company: string;
  role_family?: string;
  role_type?: string;
  url: string;
  posted_at?: string;
  start_date?: string;
  pay?: string;
  pay_min?: number;
  pay_max?: number;
  currency?: string;
  tips?: boolean;
  shift?: string;
  shift_window?: string;
  hours_band?: string;
  experience_req?: string;
  training_provided?: boolean;
  license_required?: string[];
  location?: string;
  neighbourhood?: string;
  description_html?: string;
  lat?: number;
  lng?: number;
  near_transit?: boolean;
};

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'data', 'jobs.json');
const GEO_CACHE = path.join(ROOT, 'scripts', '.geocode-cache.json');
const TTC_STOPS = path.join(ROOT, 'scripts', 'ttc-stops.json');
const TARGETS = path.join(ROOT, 'scripts', 'targets.yaml');

async function main() {
  const stops = loadStops();
  const targets = loadTargets();
  const jobs: Job[] = [];
  // Known fixes/aliases for better geocoding
  const companyAlias: Record<string, string> = {
    nobuhoteltoronto: 'Nobu Hotel Toronto',
  };
  const coordOverride: Record<string, { lat: number; lng: number; location?: string }> = {
    nobuhoteltoronto: { lat: 43.6449, lng: -79.3916, location: '25 Mercer St, Toronto, ON' },
  };

  // Greenhouse
  for (const slug of targets?.targets?.greenhouse || []) {
    const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': 'hands-on-jobs-mvp/1.0' } });
      if (!resp.ok) continue;
      const data = await resp.json() as any;
      const rows = (data?.jobs || []) as any[];
      for (const r of rows) {
        if (!/toronto/i.test(r?.location?.name || '')) continue;
        const details = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs/${r.id}`, { headers: { 'User-Agent': 'hands-on-jobs-mvp/1.0' } }).then(x => x.ok ? x.json() : null).catch(() => null);
        const j: Job = {
          id: `gh-${slug}-${r.id}`,
          title: r.title,
          company: companyAlias[slug] || r?.company?.name || slug,
          role_family: inferRole(r.title),
          url: r.absolute_url,
          posted_at: r.updated_at || r.created_at,
          currency: 'CAD',
          description_html: details?.content || undefined,
          neighbourhood: r?.location?.name || 'Downtown',
          location: coordOverride[slug]?.location,
          lat: coordOverride[slug]?.lat,
          lng: coordOverride[slug]?.lng,
        };
        jobs.push(j);
      }
    } catch {}
  }

  // TODO: Lever + smartrecruiters + auto JSON-LD best-effort

  // Geocode missing coords (polite rate limit, cached)
  const cache = loadGeoCache();
  for (const j of jobs) {
    if (j.lat != null && j.lng != null) continue;
    const query = j.location || `${j.company || ''} ${j.neighbourhood || ''} Toronto ON`.trim();
    if (!query) continue;
    const hit = cache[query];
    if (hit) {
      j.lat = hit.lat; j.lng = hit.lng;
      continue;
    }
    const g = await geocode(query);
    if (g) {
      j.lat = g.lat; j.lng = g.lng;
      cache[query] = g; saveGeoCache(cache);
    }
    await delay(1100); // ~1 rps
  }

  // Enrich
  const enriched = jobs.map(j => ({ ...j, near_transit: j.lat != null && j.lng != null ? nearTransit(j.lat, j.lng, stops) : undefined }));
  const fresh = sortNewest(dedupe(enriched)).slice(0, 1000);
  writeOut(fresh);
}

function loadStops(): { lat: number; lng: number }[] {
  if (!fs.existsSync(TTC_STOPS)) return [];
  try { return JSON.parse(fs.readFileSync(TTC_STOPS, 'utf8')); } catch { return []; }
}

function nearTransit(lat: number, lng: number, stops: { lat: number; lng: number }[], radiusM = 500) {
  for (const s of stops) {
    if (haversineKm(lat, lng, s.lat, s.lng) * 1000 <= radiusM) return true;
  }
  return false;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function writeOut(rows: Job[]) {
  const dir = path.dirname(OUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));
  console.log(`[fetch-jobs] wrote ${rows.length} → ${OUT}`);
}

function loadTargets(): any | null {
  if (!fs.existsSync(TARGETS)) return null;
  try { return yaml.parse(fs.readFileSync(TARGETS, 'utf8')); } catch { return null; }
}

function dedupe(rows: Job[]): Job[] {
  const seen = new Set<string>();
  const out: Job[] = [];
  for (const r of rows) {
    const key = `${(r.company||'').toLowerCase()}|${(r.title||'').toLowerCase()}|${Math.round((r.lat||0)*1000)}|${Math.round((r.lng||0)*1000)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function sortNewest(rows: Job[]) { return [...rows].sort((a,b) => (Date.parse(b.posted_at||'')||0) - (Date.parse(a.posted_at||'')||0)); }

function inferRole(title?: string): string | undefined {
  if (!title) return undefined;
  const t = title.toLowerCase();
  if (/(server|wait|barista|host|busser|dish|line cook|prep|crew)/.test(t)) return 'Restaurant & Cafe';
  if (/(retail|sales associate|cashier|merch|stock|grocery|clerk)/.test(t)) return 'Retail';
  if (/(warehouse|picker|packer|parcel|loader|forklift|inventory|ship|receive)/.test(t)) return 'Warehouse & Logistics';
  if (/(clean|janit|custod|housekeep|porter)/.test(t)) return 'Cleaning & Facilities';
  if (/(hotel|front desk|banquet|event|concession)/.test(t)) return 'Hotel & Events';
  if (/(mover|moving|delivery|courier|driver)/.test(t)) return 'Moving & Delivery';
  if (/(general labour|labourer|landscap|grounds|site cleanup)/.test(t)) return 'General Labour';
  return undefined;
}

type GeoPoint = { lat: number; lng: number };
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
async function geocode(query: string): Promise<GeoPoint | null> {
  try {
    const url = `${NOMINATIM}?format=json&limit=1&addressdetails=1&countrycodes=ca&q=${encodeURIComponent(query + ', Toronto, ON')}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'hands-on-jobs-mvp/1.0 (+contact@example.com)' } });
    if (!res.ok) return null;
    const arr = await res.json() as any[];
    if (!arr?.length) return null;
    const p = arr[0];
    const lat = parseFloat(p.lat); const lng = parseFloat(p.lon);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return { lat, lng };
  } catch { return null; }
}

function loadGeoCache(): Record<string, GeoPoint> {
  try { return JSON.parse(fs.readFileSync(GEO_CACHE, 'utf8')); } catch { return {}; }
}
function saveGeoCache(c: Record<string, GeoPoint>) {
  const dir = path.dirname(GEO_CACHE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(GEO_CACHE, JSON.stringify(c, null, 2));
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

main().catch(err => { console.error(err); process.exit(1); });



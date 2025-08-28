/* Minimal, compliant ingestion script (skeleton matching your spec). */
import fs from 'node:fs';
import path from 'node:path';

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
  lat?: number;
  lng?: number;
  near_transit?: boolean;
};

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'data', 'jobs.json');
const GEO_CACHE = path.join(ROOT, 'scripts', '.geocode-cache.json');
const TTC_STOPS = path.join(ROOT, 'scripts', 'ttc-stops.json');

async function main() {
  const stops = loadStops();
  const now = new Date().toISOString();
  const sample: Job[] = [
    {
      id: 'sample-keep-pipeline-1',
      title: 'Barista',
      company: 'Sample Cafe',
      role_family: 'Restaurant & Cafe',
      role_type: 'Restaurant/Bar',
      url: 'https://example.com/jobs/barista-toronto',
      posted_at: now,
      pay: '$18–$20/hr + tips',
      pay_min: 18,
      pay_max: 20,
      currency: 'CAD',
      tips: true,
      shift: 'Morning',
      shift_window: 'Morning',
      hours_band: '20–35',
      experience_req: 'None',
      training_provided: true,
      license_required: ['Smart Serve'],
      location: 'Kensington Market, Toronto, ON',
      neighbourhood: 'Kensington',
      lat: 43.6542,
      lng: -79.4007,
      near_transit: nearTransit(43.6542, -79.4007, stops),
    },
  ];
  writeOut(sample);
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

main().catch(err => { console.error(err); process.exit(1); });



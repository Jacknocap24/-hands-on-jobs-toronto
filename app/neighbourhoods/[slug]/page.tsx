import fs from 'node:fs';
import path from 'node:path';
import ClientRedirect from '@/components/ClientRedirect';
export const dynamic = 'force-static';
export const dynamicParams = false;

type Job = { neighbourhood?: string | null };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function generateStaticParams() {
  const file = path.join(process.cwd(), 'public', 'data', 'jobs.json');
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '[]';
  const jobs: Job[] = JSON.parse(raw);
  const set = new Map<string, string>();
  for (const j of jobs) {
    if (!j.neighbourhood) continue;
    const s = slugify(j.neighbourhood);
    if (!set.has(s)) set.set(s, j.neighbourhood);
  }
  const slugs = Array.from(set.keys());
  if (slugs.length === 0) slugs.push('all');
  return slugs.map((slug) => ({ slug }));
}

function resolveNeighbourhoodFromSlug(slug: string): string | null {
  const file = path.join(process.cwd(), 'public', 'data', 'jobs.json');
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '[]';
  const jobs: Job[] = JSON.parse(raw);
  const map = new Map<string, string>();
  for (const j of jobs) {
    if (!j.neighbourhood) continue;
    map.set(slugify(j.neighbourhood), j.neighbourhood);
  }
  return map.get(slug) ?? null;
}

export default function NeighbourhoodPage({ params }: { params: { slug: string } }) {
  const n = params.slug === 'all' ? null : resolveNeighbourhoodFromSlug(params.slug);
  const search = n ? `/?n=${encodeURIComponent(n)}` : '/';
  return <ClientRedirect href={search} label={n ? `Filtering by neighbourhood: ${n}` : 'All neighbourhoods'} />;
}



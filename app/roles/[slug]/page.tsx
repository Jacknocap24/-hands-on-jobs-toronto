import fs from 'node:fs';
import path from 'node:path';
import ClientRedirect from '@/components/ClientRedirect';
export const dynamic = 'force-static';
export const dynamicParams = false;

type Job = { role_type?: string | null };

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
    if (!j.role_type) continue;
    const s = slugify(j.role_type);
    if (!set.has(s)) set.set(s, j.role_type);
  }
  const slugs = Array.from(set.keys());
  if (slugs.length === 0) slugs.push('all');
  return slugs.map((slug) => ({ slug }));
}

function resolveRoleTypeFromSlug(slug: string): string | null {
  const file = path.join(process.cwd(), 'public', 'data', 'jobs.json');
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '[]';
  const jobs: Job[] = JSON.parse(raw);
  const map = new Map<string, string>();
  for (const j of jobs) {
    if (!j.role_type) continue;
    map.set(slugify(j.role_type), j.role_type);
  }
  return map.get(slug) ?? null;
}

export default function RolePage({ params }: { params: { slug: string } }) {
  const roleType = params.slug === 'all' ? null : resolveRoleTypeFromSlug(params.slug);
  const search = roleType ? `/?rt=${encodeURIComponent(roleType)}` : '/';
  return <ClientRedirect href={search} label={roleType ? `Filtering by role: ${roleType}` : 'All roles'} />;
}




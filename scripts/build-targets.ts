/* Targets Builder: auto-detect ATS slugs from brand domains or career URLs.
 * - Respects robots.txt (disallow crawl if path blocked)
 * - Tries common career paths and follows redirects (no headless)
 * - Detects Greenhouse, Lever, SmartRecruiters via pattern matching
 * - Fallbacks: RSS <link rel="alternate" type="application/rss+xml"> and JSON-LD JobPosting
 * - Writes scripts/targets.generated.yaml and scripts/targets.skipped.json
 * - Optional input CSV/JSON via --input=path.(csv|json) or reads seeds from scripts/targets.yaml targets.auto
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import yaml from 'yaml';

type AutoSeed = { url: string; city_filter?: string };
type TargetsYaml = {
  targets?: {
    greenhouse?: string[];
    lever?: string[];
    smartrecruiters?: { id: string; token?: string }[];
    auto?: AutoSeed[];
  };
};

const HEADERS: Record<string, string> = {
  'User-Agent': 'hands-on-jobs/1.0 (+contact)'
};

const GH_RE = /boards\.greenhouse\.io\/([^"\/\?]+)/i;
const LEVER_RE = /jobs\.lever\.co\/([^"\/\?]+)/i;
const SR_HOST_RE = /careers\.smartrecruiters\.com\/([^"\/\?]+)/i;
const SR_API_RE = /api\.smartrecruiters\.com\/v1\/companies\/([^\/]+)\/postings/i;

const COMMON_PATHS = ['', '/careers', '/jobs', '/join-us', '/work-with-us', '/careers/search'];

type Hit = { platform: 'greenhouse' | 'lever' | 'smartrecruiters'; id: string };
type Skip = { url: string; reason: string };

async function main() {
  const seeds = await loadSeeds();
  const results = {
    greenhouse: new Set<string>(),
    lever: new Set<string>(),
    smartrecruiters: new Set<string>(),
    skipped: [] as Skip[],
  };

  for (const seed of seeds) {
    const root = normalizeRoot(seed);
    try {
      const allowed = await isAllowedByRobots(root);
      if (!allowed) {
        results.skipped.push({ url: root, reason: 'robots_disallow' });
        continue;
      }

      const html = await tryPaths(root);
      if (!html) {
        results.skipped.push({ url: root, reason: 'no_response' });
        continue;
      }

      const hit = detectATS(html);
      if (hit) {
        if (hit.platform === 'smartrecruiters') results.smartrecruiters.add(hit.id);
        if (hit.platform === 'greenhouse') results.greenhouse.add(hit.id);
        if (hit.platform === 'lever') results.lever.add(hit.id);
        continue;
      }

      // Fallbacks: RSS or JSON-LD JobPosting
      const rssUrl = extractRssUrl(html, root);
      if (rssUrl) {
        results.skipped.push({ url: root, reason: 'rss_found' });
        continue;
      }

      const hasJobPosting = hasJsonLdJobPosting(html);
      if (hasJobPosting) {
        results.skipped.push({ url: root, reason: 'jsonld_jobposting_found' });
        continue;
      }

      results.skipped.push({ url: root, reason: 'no_ats_or_feed' });
    } catch {
      results.skipped.push({ url: root, reason: 'error' });
    }
    // Be polite
    await delay(200);
  }

  await writeOutputs(results);
  console.log('Wrote scripts/targets.generated.yaml and scripts/targets.skipped.json');
}

function normalizeRoot(seed: string | AutoSeed): string {
  const url = typeof seed === 'string' ? seed : seed.url;
  return url.replace(/\/$/, '');
}

async function loadSeeds(): Promise<(string | AutoSeed)[]> {
  const arg = process.argv.find(a => a.startsWith('--input='));
  if (arg) {
    const p = arg.split('=')[1];
    if (p.endsWith('.json')) {
      const txt = await fsp.readFile(p, 'utf8');
      const arr = JSON.parse(txt);
      if (Array.isArray(arr)) return arr as (string | AutoSeed)[];
    }
    if (p.endsWith('.csv')) {
      const txt = await fsp.readFile(p, 'utf8');
      return txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    }
  }
  // fallback to scripts/targets.yaml targets.auto
  const targetsPath = path.join(process.cwd(), 'scripts', 'targets.yaml');
  try {
    const txt = await fsp.readFile(targetsPath, 'utf8');
    const parsed = yaml.parse(txt) as TargetsYaml;
    return parsed?.targets?.auto || [];
  } catch {
    return [];
  }
}

async function isAllowedByRobots(root: string): Promise<boolean> {
  try {
    const robotsUrl = new URL('/robots.txt', ensureUrl(root)).toString();
    const res = await fetch(robotsUrl, { headers: HEADERS });
    if (!res.ok) return true; // assume allowed if missing
    const txt = await res.text();
    return checkRobotsAllows(txt, root);
  } catch {
    return true;
  }
}

function checkRobotsAllows(robotsTxt: string, target: string): boolean {
  // Very light robots parser: disallow if any Disallow rule matches a common career path
  const lines = robotsTxt.split(/\r?\n/).map(l => l.trim());
  const disallowPaths: string[] = [];
  let applies = false;
  for (const line of lines) {
    if (/^user-agent:\s*\*/i.test(line)) { applies = true; continue; }
    if (/^user-agent:/i.test(line)) { applies = false; continue; }
    if (applies) {
      const m = line.match(/^disallow:\s*(.*)$/i);
      if (m) disallowPaths.push(m[1].trim());
    }
  }
  if (disallowPaths.length === 0) return true;
  try {
    const url = new URL(ensureUrl(target));
    for (const p of COMMON_PATHS) {
      const pathToTest = (url.pathname + p) || '/';
      for (const rule of disallowPaths) {
        if (!rule) continue;
        if (rule === '/') return false;
        if (pathToTest.startsWith(rule)) return false;
      }
    }
  } catch {}
  return true;
}

function ensureUrl(u: string): string {
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

async function fetchText(url: string): Promise<string> {
  try {
    const r = await fetch(url, { headers: HEADERS, redirect: 'follow' as RequestRedirect });
    if (!r.ok) return '';
    return await r.text();
  } catch {
    return '';
  }
}

async function tryPaths(root: string): Promise<string> {
  const base = ensureUrl(root).replace(/\/$/, '');
  for (const p of COMMON_PATHS) {
    try {
      const html = await fetchText(base + p);
      if (html) return html;
    } catch {}
  }
  return '';
}

function detectATS(html: string): Hit | null {
  const gh = html.match(GH_RE)?.[1]; if (gh) return { platform: 'greenhouse', id: gh };
  const lv = html.match(LEVER_RE)?.[1]; if (lv) return { platform: 'lever', id: lv };
  const sr = html.match(SR_HOST_RE)?.[1] || html.match(SR_API_RE)?.[1]; if (sr) return { platform: 'smartrecruiters', id: sr };
  return null;
}

function extractRssUrl(html: string, root: string): string | null {
  const m = html.match(/<link[^>]+rel=["']alternate["'][^>]*type=["']application\/rss\+xml["'][^>]*>/i);
  if (!m) return null;
  const tag = m[0];
  const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
  if (!href) return null;
  if (/^https?:/i.test(href)) return href;
  try { return new URL(href, ensureUrl(root)).toString(); } catch { return null; }
}

function hasJsonLdJobPosting(html: string): boolean {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of scripts) {
    const content = block.replace(/^[\s\S]*?>/, '').replace(/<\/script>[\s\S]*$/, '');
    try {
      const json = JSON.parse(content);
      if (Array.isArray(json)) {
        if (json.some(x => normalizeType(x?.['@type']) === 'jobposting')) return true;
      } else if (json && typeof json === 'object') {
        if (normalizeType(json?.['@type']) === 'jobposting') return true;
        if (json['@graph'] && Array.isArray(json['@graph'])) {
          if (json['@graph'].some((x: any) => normalizeType(x?.['@type']) === 'jobposting')) return true;
        }
      }
    } catch {}
  }
  return false;
}

function normalizeType(t: any): string | undefined {
  if (typeof t === 'string') return t.toLowerCase();
  if (Array.isArray(t)) return (t.find(x => typeof x === 'string') || '').toLowerCase();
  return undefined;
}

async function writeOutputs(results: { greenhouse: Set<string>; lever: Set<string>; smartrecruiters: Set<string>; skipped: Skip[]; }) {
  const generatedYaml = buildGeneratedYaml(results);
  const outYamlPath = path.join(process.cwd(), 'scripts', 'targets.generated.yaml');
  const skippedPath = path.join(process.cwd(), 'scripts', 'targets.skipped.json');
  await fsp.writeFile(outYamlPath, generatedYaml);
  await fsp.writeFile(skippedPath, JSON.stringify(results.skipped, null, 2));
}

function buildGeneratedYaml(results: { greenhouse: Set<string>; lever: Set<string>; smartrecruiters: Set<string>; }) {
  const gh = [...results.greenhouse];
  const lv = [...results.lever];
  const sr = [...results.smartrecruiters];
  const yamlStr = `targets:\n  greenhouse:\n${gh.map(s => `    - "${s}"`).join('\n') || '    -'}\n  lever:\n${lv.map(s => `    - "${s}"`).join('\n') || '    -'}\n  smartrecruiters:\n${sr.map(s => `    - { id: "${s}" }`).join('\n') || '    -'}\n`;
  return yamlStr;
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

main().catch(err => { console.error(err); process.exit(1); });



"use client";
import Link from 'next/link';
import { DerivedJob } from '@/hooks/useJobs';

type Props = {
  job: DerivedJob;
  selected?: boolean;
  onSelect?: () => void;
};

export function JobCard({ job, selected, onSelect }: Props) {
  return (
    <article
      data-job-id={job.id}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); } }}
      className={`p-4 flex flex-col gap-2 cursor-pointer ${selected ? 'bg-blue-50' : ''}`}
      onMouseEnter={onSelect}
      onClick={onSelect}
      role="button"
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink leading-tight">{job.title}</h3>
          <p className="text-sm text-muted">{job.company}{job.neighbourhood ? ` • ${job.neighbourhood}` : ''}</p>
        </div>
        {job.payDisplay && (
          <span className="px-2 py-1 rounded-full text-xs bg-brand text-white">{job.payDisplay}</span>
        )}
      </div>
      {job.shiftBadges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.shiftBadges.map(b => (
            <span key={b} className="px-2 py-1 rounded-full text-xs border border-border">{b}</span>
          ))}
        </div>
      )}
      {job.learning && (
        <p className="text-sm">What you’ll learn: <span className="text-muted">{job.learning}</span></p>
      )}
      <div className="mt-1 flex items-center gap-3 text-sm text-muted">
        {job.freshnessLabel && <span>{job.freshnessLabel}</span>}
        {typeof job.distanceKm === 'number' && <span>• {job.distanceKm.toFixed(1)} km</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <a className="px-3 py-2 rounded-md bg-brand text-white focus-ring" href={job.url} target="_blank" rel="noreferrer">Apply on original site</a>
        <Link className="px-3 py-2 rounded-md border border-border focus-ring" href="#report">Report job</Link>
      </div>
    </article>
  );
}

export default JobCard;



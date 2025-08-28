"use client";
import { DerivedJob } from '@/hooks/useJobs';

type Props = {
  job: DerivedJob | null;
  onClose: () => void;
};

export default function JobModal({ job, onClose }: Props) {
  if (!job) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-[10%] mx-auto max-w-2xl bg-white rounded-lg shadow-lg border border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold leading-tight">{job.title}</h2>
            <p className="text-sm text-muted">{job.company}{job.neighbourhood ? ` • ${job.neighbourhood}` : ''}</p>
          </div>
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-border focus-ring">Close</button>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {job.payDisplay && <div><span className="font-medium">Compensation:</span> {job.payDisplay}</div>}
          {job.shift && <div><span className="font-medium">Shift:</span> {job.shift}</div>}
          {job.hours_band && <div><span className="font-medium">Hours:</span> {job.hours_band}</div>}
          {job.experience_req && <div><span className="font-medium">Experience:</span> {job.experience_req}</div>}
          {job.training_provided && <div><span className="font-medium">Training provided</span></div>}
          {job.learning && <div><span className="font-medium">What you’ll learn:</span> {job.learning}</div>}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <a className="px-3 py-2 rounded-md bg-brand text-white focus-ring" href={job.url} target="_blank" rel="noreferrer">Apply on original site</a>
          <a className="px-3 py-2 rounded-md border border-border focus-ring" href={mailtoReport(job)}>Report job</a>
        </div>
      </div>
    </div>
  );
}

function mailtoReport(job: DerivedJob) {
  const subject = encodeURIComponent(`Report job: ${job.title} — ${job.company}`);
  const body = encodeURIComponent(`Job title: ${job.title}\nCompany: ${job.company}\nURL: ${job.url}\nIssue: `);
  return `mailto:?subject=${subject}&body=${body}`;
}



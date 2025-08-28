"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useJobs } from '@/hooks/useJobs';

export default function JobPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">Loading…</div>}>
      <JobClient />
    </Suspense>
  );
}

function JobClient() {
  const params = useSearchParams();
  const id = params.get('id');
  const { jobs } = useJobs();
  const job = jobs.find(j => j.id === id) || null;
  if (!job) {
    return <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">Job not found.</div>;
  }
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold">{job.title}</h1>
      <p className="text-muted">{job.company}{job.neighbourhood ? ` • ${job.neighbourhood}` : ''}</p>
      <div className="mt-4 space-y-2">
        {job.payDisplay && <div><span className="font-medium">Compensation:</span> {job.payDisplay}</div>}
        {job.shift && <div><span className="font-medium">Shift:</span> {job.shift}</div>}
        {job.hours_band && <div><span className="font-medium">Hours:</span> {job.hours_band}</div>}
        {job.experience_req && <div><span className="font-medium">Experience:</span> {job.experience_req}</div>}
        {job.training_provided && <div><span className="font-medium">Training provided</span></div>}
      </div>
      <div className="mt-6 flex items-center gap-2">
        <a className="px-3 py-2 rounded-md bg-brand text-white focus-ring" href={job.url} target="_blank" rel="noreferrer">Apply on original site</a>
      </div>
    </div>
  );
}



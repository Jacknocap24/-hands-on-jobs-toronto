"use client";
import dynamic from 'next/dynamic';
import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { FiltersBar } from '@/components/FiltersBar';
import { JobCard } from '@/components/JobCard';
import JobModal from '@/components/JobModal';
import { useJobs } from '@/hooks/useJobs';
import { useFilters } from '@/hooks/useFilters';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

function ClientContent() {
  const { jobs, isLoading, error, userLocation } = useJobs();
  const {
    state,
    setQuickToggle,
    setAdvanced,
    setSort,
    includeOlder,
  } = useFilters();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => state.applyAll(jobs, userLocation), [state, jobs, userLocation]);
  const results = useMemo(() => state.applySort(filtered, userLocation), [state, filtered, userLocation]);
  const selectedJob = useMemo(() => results.find(j => j.id === selectedId) || null, [results, selectedId]);

  useEffect(() => {
    if (selectedId && !results.some(j => j.id === selectedId)) {
      setSelectedId(null);
    }
  }, [results, selectedId]);

  return (
    <div className="py-4">
      <FiltersBar
        state={state}
        setQuickToggle={setQuickToggle}
        setAdvanced={setAdvanced}
        setSort={setSort}
        resultsCount={results.length}
      />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-lg overflow-hidden border border-border h-[60vh] lg:h-[calc(100vh-220px)]">
          <Map
            jobs={results}
            selectedId={selectedId}
            onSelect={setSelectedId}
            userLocation={userLocation}
          />
        </div>
        <div ref={resultsRef} className="lg:col-span-2 overflow-hidden rounded-lg border border-border">
          <div className="h-[60vh] lg:h-[calc(100vh-220px)] overflow-y-auto divide-y">
            {isLoading && <div className="p-4">Loading jobs…</div>}
            {!isLoading && results.length === 0 && (
              <div className="p-6 text-center text-muted">
                <p className="font-medium text-ink mb-1">No matching roles right now</p>
                <p>Try adjusting filters or including older postings.</p>
              </div>
            )}
            {results.map(job => (
              <JobCard key={job.id} job={job} selected={job.id === selectedId} onSelect={() => setSelectedId(job.id)} />
            ))}
          </div>
        </div>
      </div>
      <JobModal job={selectedJob} onClose={() => setSelectedId(null)} />
    </div>
  );
}

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6">
      <Suspense fallback={<div className="py-8">Loading…</div>}>
        <ClientContent />
      </Suspense>
    </main>
  );
}



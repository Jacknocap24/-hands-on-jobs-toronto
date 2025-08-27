"use client";
import { AdvancedFiltersDrawer } from '@/components/AdvancedFiltersDrawer';
import { FiltersState } from '@/hooks/useFilters';
import { useState } from 'react';

type Props = {
  state: FiltersState;
  setQuickToggle: (key: keyof FiltersState['quick'], value: boolean) => void;
  setAdvanced: (next: Partial<FiltersState['advanced']>) => void;
  setSort: (sort: FiltersState['sort']) => void;
  resultsCount: number;
};

export function FiltersBar({ state, setQuickToggle, setAdvanced, setSort, resultsCount }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-[57px] z-30 bg-white border-b border-border py-2">
      <div className="flex flex-wrap items-center gap-2">        
        <button className={chipClass(state.quick.nearMe)} onClick={() => setQuickToggle('nearMe', !state.quick.nearMe)}>Near me ≤3 km</button>
        <button className={chipClass(state.quick.pay18)} onClick={() => setQuickToggle('pay18', !state.quick.pay18)}>Pay ≥ $18/hr</button>
        <button className={chipClass(state.quick.sameDay)} onClick={() => setQuickToggle('sameDay', !state.quick.sameDay)}>Start today/tomorrow</button>
        <button className={chipClass(state.quick.noExp)} onClick={() => setQuickToggle('noExp', !state.quick.noExp)}>No experience required</button>
        <button className={chipClass(state.quick.nearTransit)} onClick={() => setQuickToggle('nearTransit', !state.quick.nearTransit)}>Near transit</button>
        <button className={chipClass(state.quick.payListed)} onClick={() => setQuickToggle('payListed', !state.quick.payListed)}>Pay listed only</button>

        <div className="ml-auto flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" checked={state.advanced.includeOlder ?? false} onChange={(e) => setAdvanced({ includeOlder: e.target.checked })} />
            Include older
          </label>
          <select
            className="px-3 py-2 border border-border rounded-md focus-ring"
            value={state.sort}
            onChange={(e) => setSort(e.target.value as FiltersState['sort'])}
            aria-label="Sort results"
          >
            <option value="newest">Newest</option>
            <option value="closest">Closest</option>
            <option value="highestPay">Highest pay</option>
          </select>
          <button className="px-3 py-2 rounded-md border border-border focus-ring" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
            Filters
          </button>
        </div>
      </div>
      <div className="mt-2 text-sm" aria-live="polite">{resultsCount} roles</div>

      <AdvancedFiltersDrawer open={open} onClose={() => setOpen(false)} state={state} setAdvanced={setAdvanced} />
    </div>
  );
}

function chipClass(active: boolean) {
  return `px-3 py-2 rounded-full border ${active ? 'bg-sky-500 text-white border-sky-500' : 'border-border hover:bg-border'} focus-ring`;
}



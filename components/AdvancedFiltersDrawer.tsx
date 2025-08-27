"use client";
import { FiltersState } from '@/hooks/useFilters';
import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  state: FiltersState;
  setAdvanced: (next: Partial<FiltersState['advanced']>) => void;
};

const neighbourhoods = [
  'Downtown', 'Kensington', 'Annex', 'Midtown', 'Danforth', 'North York', 'Scarborough', 'Etobicoke'
];
const roleTypes = [
  'Restaurant/Bar','Retail','Warehouse/Logistics','Cleaning','Hotel/Event','Moving/Delivery'
];
const shifts = ['Morning','Afternoon','Evening','Overnight'];

export function AdvancedFiltersDrawer({ open, onClose, state, setAdvanced }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const a = state.advanced;

  function toggleArray(key: keyof FiltersState['advanced'], value: string) {
    const arr = new Set<string>((a[key] as string[] | undefined) ?? []);
    if (arr.has(value)) arr.delete(value); else arr.add(value);
    setAdvanced({ [key]: Array.from(arr) } as any);
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div ref={dialogRef} tabIndex={-1} className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 overflow-y-auto focus-ring">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Advanced filters</h2>
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-border focus-ring">Close</button>
        </div>

        <section className="space-y-4">
          <div>
            <div className="font-medium mb-2">Neighbourhood</div>
            <div className="flex flex-wrap gap-2">
              {neighbourhoods.map(n => (
                <button key={n} className={chipClass((a.neighbourhoods ?? []).includes(n))} onClick={() => toggleArray('neighbourhoods', n)}>{n}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium mb-2">Role type</div>
            <div className="flex flex-wrap gap-2">
              {roleTypes.map(n => (
                <button key={n} className={chipClass((a.roleTypes ?? []).includes(n))} onClick={() => toggleArray('roleTypes', n)}>{n}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium mb-2">Shift time</div>
            <div className="flex flex-wrap gap-2">
              {shifts.map(s => (
                <button key={s} className={chipClass((a.shifts ?? []).includes(s))} onClick={() => toggleArray('shifts', s)}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium mb-2">Hours band</div>
            <div className="flex gap-2">
              {['<20','20–35','35+'].map(h => (
                <button key={h} className={chipClass(a.hoursBand === h)} onClick={() => setAdvanced({ hoursBand: a.hoursBand === h ? undefined : h })}>{h}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium mb-2">Compensation options</div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={a.tips ?? false} onChange={e => setAdvanced({ tips: e.target.checked })} /> Tips
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={a.trainingProvided ?? false} onChange={e => setAdvanced({ trainingProvided: e.target.checked })} /> Training provided
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={a.overtimePossible ?? false} onChange={e => setAdvanced({ overtimePossible: e.target.checked })} /> Overtime possible
            </label>
          </div>

          <div>
            <div className="font-medium mb-2">Start date</div>
            <div className="flex gap-2">
              {(['today','7days','month'] as const).map(s => (
                <button key={s} className={chipClass(a.startDate === s)} onClick={() => setAdvanced({ startDate: a.startDate === s ? undefined : s })}>
                  {s === 'today' ? 'Today' : s === '7days' ? '≤7 days' : 'This month'}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function chipClass(active: boolean) {
  return `px-3 py-2 rounded-full border ${active ? 'bg-brand text-white border-brand' : 'border-border hover:bg-border'} focus-ring`;
}

export default AdvancedFiltersDrawer;



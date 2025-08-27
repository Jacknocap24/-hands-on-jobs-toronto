"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ClientRedirect({ href, label }: { href: string; label?: string }) {
  const router = useRouter();
  useEffect(() => { router.replace(href, { scroll: false }); }, [router, href]);
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      Loading… {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}

export default ClientRedirect;



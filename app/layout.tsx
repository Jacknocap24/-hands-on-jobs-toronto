import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PUBLIC_BASE_PATH } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL('https://hands-on-jobs-toronto.example'),
  title: 'Hands-On Jobs • Toronto',
  description: 'Entry-level, hands-on, service & operations roles across Toronto. Learn on the job and grow your skills.',
  openGraph: {
    title: 'Hands-On Jobs • Toronto',
    description: 'Entry-level, hands-on, service & operations roles across Toronto.',
    url: 'https://hands-on-jobs-toronto.example',
    siteName: 'Hands-On Jobs • Toronto',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-white text-ink">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 focus-ring" aria-label="Hands-On Jobs Toronto home">
              <img src={`${PUBLIC_BASE_PATH}/logo.svg`} alt="Hands-On Jobs Toronto logo" className="h-8 w-8" />
              <span className="font-semibold tracking-tight">Hands-On Jobs • Toronto</span>
            </Link>
            <div />
          </div>
        </header>
        {children}
        <footer className="border-t border-border py-6 mt-8 text-sm text-muted">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between">
            <p>Map data © OpenStreetMap contributors</p>
            <a className="hover:text-ink" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
          </div>
        </footer>
      </body>
    </html>
  );
}



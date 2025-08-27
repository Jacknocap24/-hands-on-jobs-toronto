# Hands-On Jobs • Toronto

Entry-level, hands-on, service & operations roles across Toronto. Map-first UI built with Next.js 14 (App Router), TypeScript, Tailwind, and Leaflet. Jobs live in `public/data/jobs.json`.

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

- Vercel: import this repo; Next.js is auto-detected. Static export is enabled via `output: 'export'`.
- Static files: after `npm run build`, output is in `.next/` (serve with any static host that supports Next.js export). For plain static hosting, use Vercel’s Static Publishing or an adapter.

## Data

- Edit `public/data/jobs.json` (array). Tolerant schema:
  `{ title, company, neighbourhood, pay, pay_min, pay_max, currency, tips, shift, shift_window, hours_band, role_type, start_date, posted_at, near_transit, experience_req, training_provided, lat, lng, url }`.

## Credits

- Map data © OpenStreetMap contributors
- Dignity-first language; accessible UI with visible focus and keyboard support


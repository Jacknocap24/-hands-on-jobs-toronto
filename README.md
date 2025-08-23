# Hands-On Jobs • Toronto

A dignity-first, map-first directory of entry-level, hands-on, service & operations roles across Toronto. Built with Leaflet, OpenStreetMap tiles, MarkerCluster, and Leaflet Control Geocoder. No frameworks, no trackers, no cookies.

## Live demo / GitHub Pages

- Host on GitHub Pages from this repo main branch.
- Replace `YOUR_USERNAME` in `index.html` canonical and the Issues link.
- URL will be `https://YOUR_USERNAME.github.io/hands-on-jobs-toronto/`.

## Run locally

- Easiest: just open `index.html` in a modern browser.
  - The page renders the map and UI immediately.
  - Loading `data/jobs.json` via `file://` may be blocked by the browser. This is handled gracefully and shows the empty state.
  - Geolocation (Use my location) typically requires HTTPS or `localhost`. It will work on GitHub Pages.
- Alternatively, serve this folder with a tiny static server, for example:
  - Python 3: `python3 -m http.server 8080`
  - Node (if installed): `npx http-server -p 8080`

## Add or update jobs

Edit `data/jobs.json`. It must be a JSON array. Each job uses this structure:

```json
{
  "title": "Barista",
  "company": "Friendly Cafe",
  "neighbourhood": "Kensington Market",
  "pay": "$17–$20/hr + tips",
  "shift": "Morning",
  "lat": 43.6542,
  "lng": -79.4007,
  "url": "https://example.com/jobs/barista"
}
```

- Add one object per role. Save and refresh.
- The map pins and left panel cards update. Clicking a card focuses its marker and opens the popup. The "Apply on original site" button opens the external URL in a new tab.

### Getting lat/lng (geocoding)

- Use OpenStreetMap Nominatim: search for an address, then right-click on a map to inspect coordinates.
- Or use the site’s search box to find the place, then copy approximate coordinates from the map or from `https://www.openstreetmap.org` (search, then use Share to get coordinates).
- Prefer approximate intersections or public locations near the workplace to protect privacy; avoid exact private addresses.

## Content guidance (dignity-first language)

- Say: "entry-level", "hands-on", "service & operations", "on-the-job skills".
- Avoid: "low-skill", "unskilled", "menial", and any age, gender, or appearance terms.
- Use clear, respectful tone; describe tasks and shifts plainly.

## Freshness policy and user reporting

- Listings should be reviewed for freshness at least every 72 hours.
- Remove or update roles that are closed or significantly changed.
- Invite reports via Issues: `https://github.com/YOUR_USERNAME/hands-on-jobs-toronto/issues/new`.

## Privacy and performance

- No analytics, trackers, or cookies.
- Only client-side fetch to `data/jobs.json`.
- Fast first paint; scripts use `defer`. Custom JS+CSS are lean (<200KB across project code; third‑party CDNs provide maps and controls).

## SEO basics

- Descriptive title, meta description, OG tags, canonical URL, and favicon are included in `index.html`.

## Credits

- Map © OpenStreetMap contributors.
- Built with Leaflet, Leaflet.markercluster, and Leaflet Control Geocoder.

## License

- MIT — see `LICENSE`.

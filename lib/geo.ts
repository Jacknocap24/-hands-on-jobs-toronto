export type LatLng = { lat: number; lng: number };

const R = 6371; // km

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng));
  return R * c;
}

function toRad(v: number) { return v * Math.PI / 180; }

export const TORONTO_CENTER: LatLng = { lat: 43.6532, lng: -79.3832 };



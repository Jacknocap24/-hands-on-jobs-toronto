"use client";
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import 'leaflet.markercluster';
import type { DerivedJob } from '@/hooks/useJobs';

type Props = {
  jobs: DerivedJob[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  userLocation: { lat: number; lng: number } | null;
};

const TORONTO = { lat: 43.6532, lng: -79.3832 };

function SetupControls({ onSelect, selectedId }: { onSelect: (id: string | null) => void; selectedId: string | null }) {
  const map = useMap();
  useEffect(() => {
    const geocoder = (L.Control as any).geocoder({ defaultMarkGeocode: false })
      .on('markgeocode', function (e: any) {
        map.fitBounds(e.geocode.bbox);
      })
      .addTo(map);
    return () => {
      geocoder.remove();
    };
  }, [map]);
  useEffect(() => {
    if (!selectedId) return;
    // Bounce animation could be implemented via custom icon class; here ensure focus
  }, [selectedId]);
  return null;
}

function ClusterLayer({ jobs, selectedId, onSelect }: { jobs: DerivedJob[]; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const map = useMap();
  useEffect(() => {
    const clusterGroup = new (L as any).MarkerClusterGroup({
      showCoverageOnHover: false,
    });
    const markers: L.Marker[] = [];
    jobs.forEach(j => {
      if (j.lat == null || j.lng == null) return;
      const m = L.marker([j.lat, j.lng]);
      m.on('click', () => onSelect(j.id));
      m.bindPopup(`<div class="text-sm"><div class="font-medium">${j.title ?? ''}</div><div class="text-muted">${j.company ?? ''}</div></div>`);
      markers.push(m);
      clusterGroup.addLayer(m);
    });
    clusterGroup.addTo(map);

    if (selectedId) {
      const sel = markers.find(m => (m as any)?.options?.alt === selectedId || (m.getPopup()?.getContent() as string)?.includes(`>${(jobs.find(j => j.id === selectedId)?.title ?? '').toString()}<`));
      if (sel) {
        map.panTo(sel.getLatLng());
        sel.openPopup();
      }
    }

    return () => {
      clusterGroup.remove();
    };
  }, [map, jobs, selectedId, onSelect]);
  return null;
}

export default function Map({ jobs, selectedId, onSelect, userLocation }: Props) {
  const center = userLocation ?? TORONTO;
  const markers = useMemo(() => jobs.filter(j => typeof j.lat === 'number' && typeof j.lng === 'number'), [jobs]);

  useEffect(() => {
    // Fix default icon paths for Leaflet in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/leaflet/images/marker-icon-2x.png`,
      iconUrl: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/leaflet/images/marker-icon.png`,
      shadowUrl: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/leaflet/images/marker-shadow.png`,
    });
  }, []);

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SetupControls onSelect={onSelect} selectedId={selectedId} />
      <ClusterLayer jobs={markers} selectedId={selectedId} onSelect={onSelect} />
    </MapContainer>
  );
}



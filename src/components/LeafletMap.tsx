import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapMarker {
  lat: number;
  lng: number;
  type: 'customer' | 'collector' | 'pickup';
  label?: string;
  isLive?: boolean;
}

interface LeafletMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  showRoute?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  followCollector?: boolean;
}

const customerIcon = L.divIcon({
  html: `<div style="background:#2c6f53;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:white;font-size:14px;">📍</span></div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const pickupIcon = L.divIcon({
  html: `<div style="background:#f59e0b;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function createCollectorIcon(isLive: boolean) {
  const pulseClass = isLive ? 'live-marker' : '';
  return L.divIcon({
    html: `<div class="${pulseClass}" style="width:28px;height:28px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 2px 8px rgba(16,185,129,0.5);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:12px;font-weight:bold;">🚛</span></div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function LeafletMap({
  markers,
  center,
  zoom = 14,
  className = '',
  showRoute = false,
  onMapClick,
  followCollector = false,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const routeRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: L.LatLngExpression = center
      ? [center.lat, center.lng]
      : [5.6118, -0.0698];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentKeys = new Set(markers.map((_, i) => `marker-${i}`));
    Object.keys(markersRef.current).forEach((key) => {
      if (!currentKeys.has(key)) {
        map.removeLayer(markersRef.current[key]);
        delete markersRef.current[key];
      }
    });

    markers.forEach((m, i) => {
      const key = `marker-${i}`;
      const latlng: L.LatLngExpression = [m.lat, m.lng];
      const icon =
        m.type === 'customer' ? customerIcon : m.type === 'pickup' ? pickupIcon : createCollectorIcon(!!m.isLive);

      if (markersRef.current[key]) {
        markersRef.current[key].setLatLng(latlng);
        if (m.type === 'collector') {
          markersRef.current[key].setIcon(icon);
        }
      } else {
        const marker = L.marker(latlng, { icon }).addTo(map);
        if (m.label) marker.bindPopup(m.label);
        markersRef.current[key] = marker;
      }
    });

    if (showRoute && markers.length >= 2) {
      const collector = markers.find((m) => m.type === 'collector');
      const target = markers.find((m) => m.type === 'customer' || m.type === 'pickup');
      if (collector && target) {
        const routeCoords: L.LatLngExpression[] = [
          [collector.lat, collector.lng],
          [target.lat, target.lng],
        ];
        if (routeRef.current) {
          routeRef.current.setLatLngs(routeCoords);
        } else {
          routeRef.current = L.polyline(routeCoords, {
            color: '#10b981',
            weight: 3,
            opacity: 0.6,
            dashArray: '8 8',
          }).addTo(map);
        }
      }
    } else if (routeRef.current) {
      map.removeLayer(routeRef.current);
      routeRef.current = null;
    }

    if (followCollector) {
      const collector = markers.find((m) => m.type === 'collector');
      if (collector) {
        map.panTo([collector.lat, collector.lng], { animate: true, duration: 0.5 });
      }
    }
  }, [markers, showRoute, followCollector]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center?.lat, center?.lng, zoom]);

  return <div ref={containerRef} className={className} style={{ minHeight: '300px' }} />;
}

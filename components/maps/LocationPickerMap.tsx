"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

// Fix for default marker icon in Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type LocationPickerMapProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
};

const DEFAULT_CENTER: [number, number] = [16.047079, 108.20623];

function MapClickHandler({ onChange }: { onChange: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function CenterOnMarker({ markerPosition }: { markerPosition: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size on mount to ensure tiles load correctly
    map.invalidateSize();
    if (markerPosition) {
      map.flyTo(markerPosition, Math.max(map.getZoom(), 15), { duration: 0.6 });
    }
  }, [markerPosition, map]);

  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
}: LocationPickerMapProps) {
  const markerPosition =
    latitude != null && longitude != null
      ? ([latitude, longitude] as [number, number])
      : null;
  const center = markerPosition ?? DEFAULT_CENTER;

  // Memoize custom icon
  const markerBlue = useMemo(() => L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }), []);

  return (
    <MapContainer
      center={center}
      zoom={markerPosition ? 15 : 6}
      className="h-full w-full z-0"
      scrollWheelZoom
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <MapClickHandler onChange={onChange} />
      <CenterOnMarker markerPosition={markerPosition} />

      {markerPosition && (
        <Marker
          position={markerPosition}
          draggable
          icon={markerBlue}
          eventHandlers={{
            dragend(event) {
              const marker = event.target as L.Marker;
              const next = marker.getLatLng();
              onChange(next.lat, next.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}

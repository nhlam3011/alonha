"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  useEffect(() => {
    const updateTheme = () => {
      const docTheme = document.documentElement.getAttribute("data-theme");
      setTheme(docTheme === "dark" ? "dark" : "light");
    };
    
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    
    return () => observer.disconnect();
  }, []);
  
  return theme;
}

export type MapListingPoint = {
  id: string;
  slug: string;
  title: string;
  address?: string | null;
  price: number;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  listingType: "SALE" | "RENT";
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
};

type ListingMarkersMapProps = {
  listings: MapListingPoint[];
  selectedListingId: string | null;
  onSelectListing: (listingId: string) => void;
  /** Khi AI search phát hiện địa điểm, bay bản đồ đến vị trí này */
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
};

const DEFAULT_CENTER: [number, number] = [16.047079, 108.20623];

function formatPriceShort(value: number): string {
  if (value <= 0) return "LH";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}tỷ`;
  if (value >= 1e6) return `${Math.round(value / 1e6)}tr`;
  return `${(value / 1000).toFixed(0)}k`;
}

function formatPriceFull(value: number): string {
  if (value <= 0) return "Thỏa thuận";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} tỷ`;
  if (value >= 1e6) return `${Math.round(value / 1e6)} triệu`;
  return `${value.toLocaleString("vi-VN")} đ`;
}

function createPriceIcon(
  price: number, 
  isSelected: boolean, 
  listingType: "SALE" | "RENT",
  theme: "light" | "dark"
) {
  const text = formatPriceShort(price);
  const isSale = listingType === "SALE";

  // Theme-aware colors
  const saleColor = theme === "dark" ? "#f87171" : "#ef4444";
  const rentColor = theme === "dark" ? "#60a5fa" : "#2563eb";
  const saleBg = theme === "dark" ? "#7f1d1d" : "#fef2f2";
  const rentBg = theme === "dark" ? "#1e3a8a" : "#eff6ff";
  const bgLight = theme === "dark" ? "#1e293b" : "#ffffff";
  const textLight = theme === "dark" ? "#f1f5f9" : "#0f172a";
  const borderLight = theme === "dark" ? "#334155" : "#e2e8f0";

  const bg = isSelected
    ? (isSale ? saleColor : rentColor)
    : bgLight;
  const color = isSelected
    ? "#ffffff"
    : (isSale ? saleColor : rentColor);
  const border = isSelected
    ? "transparent"
    : (isSale ? (theme === "dark" ? "#991b1b" : "#fecaca") : (theme === "dark" ? "#1e40af" : "#bfdbfe"));
  const shadow = isSelected 
    ? (theme === "dark" ? "0 4px 14px rgba(0,0,0,.5)" : "0 4px 14px rgba(0,0,0,.3)")
    : (theme === "dark" ? "0 2px 8px rgba(0,0,0,.4)" : "0 2px 8px rgba(0,0,0,.12)");
  const scale = isSelected ? "scale(1.18)" : "scale(1)";

  return L.divIcon({
    className: "",
    html: `<div style="
      background:${bg};color:${color};border:2px solid ${border};
      padding:3px 8px;border-radius:16px;font-weight:700;font-size:11px;
      white-space:nowrap;cursor:pointer;box-shadow:${shadow};
      transform:${scale};transition:all .2s ease;
      display:inline-flex;align-items:center;justify-content:center;
      font-family:system-ui,-apple-system,sans-serif;line-height:1.2;
    ">${text}</div>`,
    iconSize: [0, 0],
    iconAnchor: [28, 14],
    popupAnchor: [0, -18],
  });
}

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function FitAllMarkers({ listings, hasExternalFly }: { listings: MapListingPoint[]; hasExternalFly: boolean }) {
  const map = useMap();
  useEffect(() => {
    // Nếu đã có flyToLocation từ AI search, không fitBounds tự động
    if (hasExternalFly) return;
    const t = setTimeout(() => {
      try {
        map.invalidateSize();
        if (listings.length === 0) { map.setView(DEFAULT_CENTER, 6); return; }
        if (listings.length === 1) { map.setView([listings[0].latitude, listings[0].longitude], 15); return; }
        const bounds = L.latLngBounds(listings.map((l) => [l.latitude, l.longitude] as [number, number]));
        map.fitBounds(bounds.pad(0.12), { maxZoom: 16, animate: true });
      } catch {}
    }, 150);
    return () => clearTimeout(t);
  }, [listings, map, hasExternalFly]);
  return null;
}

/** Bay bản đồ đến vị trí AI search phát hiện (phường/quận/tỉnh) */
function FlyToArea({ location }: { location: { lat: number; lng: number; zoom?: number } | null }) {
  const map = useMap();
  const prevKey = useRef("");
  useEffect(() => {
    if (!location) return;
    const key = `${location.lat},${location.lng}`;
    if (key === prevKey.current) return;
    prevKey.current = key;
    const t = setTimeout(() => {
      try { map.flyTo([location.lat, location.lng], location.zoom ?? 14, { duration: 1.2 }); } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [location, map]);
  return null;
}

function FocusSelected({ listing }: { listing: MapListingPoint | null }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);
  useEffect(() => {
    if (!listing || prevId.current === listing.id) return;
    prevId.current = listing.id;
    const t = setTimeout(() => {
      try { map.flyTo([listing.latitude, listing.longitude], 16, { duration: 0.6 }); } catch {}
    }, 120);
    return () => clearTimeout(t);
  }, [listing, map]);
  return null;
}

function LocateButton() {
  const map = useMap();
  const [busy, setBusy] = useState(false);
  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { map.flyTo([p.coords.latitude, p.coords.longitude], 15, { duration: 1 }); setBusy(false); },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [map]);

  return (
    <button
      onClick={locate}
      disabled={busy}
      className="absolute bottom-20 right-3 z-[1000] flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)]/95 shadow-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition disabled:opacity-50 backdrop-blur-sm"
      title="Vị trí của tôi"
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
      )}
    </button>
  );
}

function ResetButton({ listings }: { listings: MapListingPoint[] }) {
  const map = useMap();
  return (
    <button
      onClick={() => {
        if (listings.length === 0) { map.setView(DEFAULT_CENTER, 6); return; }
        const bounds = L.latLngBounds(listings.map((l) => [l.latitude, l.longitude] as [number, number]));
        map.fitBounds(bounds.pad(0.12), { maxZoom: 16, animate: true });
      }}
      className="absolute bottom-9 right-3 z-[1000] flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)]/95 shadow-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition backdrop-blur-sm"
      title="Xem tất cả"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
    </button>
  );
}

export default function ListingMarkersMap({
  listings,
  selectedListingId,
  onSelectListing,
  flyToLocation,
}: ListingMarkersMapProps) {
  const theme = useTheme();
  const selected = listings.find((l) => l.id === selectedListingId) ?? null;
  const hasExternalFly = flyToLocation != null;

  const center = selected
    ? ([selected.latitude, selected.longitude] as [number, number])
    : flyToLocation
      ? ([flyToLocation.lat, flyToLocation.lng] as [number, number])
      : listings.length > 0
        ? ([listings[0].latitude, listings[0].longitude] as [number, number])
        : DEFAULT_CENTER;

  // Theme-aware colors for popup
  const popupBg = theme === "dark" ? "#1e293b" : "#ffffff";
  const popupText = theme === "dark" ? "#f1f5f9" : "#0f172a";
  const popupMuted = theme === "dark" ? "#94a3b8" : "#64748b";
  const popupPlaceholder = theme === "dark" ? "#334155" : "#f1f5f9";
  const popupPlaceholderText = theme === "dark" ? "#64748b" : "#94a3b8";
  const saleColor = theme === "dark" ? "#f87171" : "#ef4444";
  const rentColor = theme === "dark" ? "#60a5fa" : "#2563eb";
  const priceColor = theme === "dark" ? "#f87171" : "#ef4444";

  return (
    <MapContainer center={center} zoom={flyToLocation?.zoom ?? 10} className="h-full w-full outline-none" scrollWheelZoom style={{ zIndex: 0 }}>
      <TileLayer
        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
      />
      <MapReady />
      <FitAllMarkers listings={listings} hasExternalFly={hasExternalFly} />
      <FlyToArea location={flyToLocation ?? null} />
      <FocusSelected listing={selected} />
      <LocateButton />
      <ResetButton listings={listings} />

      {listings.map((item) => (
        <Marker
          key={item.id}
          position={[item.latitude, item.longitude]}
          icon={createPriceIcon(item.price, item.id === selected?.id, item.listingType, theme)}
          eventHandlers={{
            click: () => onSelectListing(item.id),
            mouseover: (e) => { e.target.openPopup(); onSelectListing(item.id); },
            mouseout: (e) => { setTimeout(() => e.target.closePopup(), 2500); },
          }}
          zIndexOffset={item.id === selected?.id ? 1000 : 0}
        >
          <Popup closeButton={false} offset={[0, -16]} maxWidth={230} minWidth={210} className="minimal-popup">
            <Link href={`/bat-dong-san/${item.slug}`} className="block w-[210px]" style={{ textDecoration: "none" }}>
              <div className="overflow-hidden rounded-lg" style={{ background: popupBg }}>
                {/* Image */}
                {item.imageUrl ? (
                  <div style={{ position: "relative", height: "110px", width: "100%", overflow: "hidden" }}>
                    <img src={item.imageUrl} alt="" style={{ height: "100%", width: "100%", objectFit: "cover" }} loading="lazy" />
                    <span style={{
                      position: "absolute", top: "6px", left: "6px",
                      borderRadius: "4px", padding: "2px 6px",
                      fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.02em",
                      background: item.listingType === "SALE" ? saleColor : rentColor,
                    }}>
                      {item.listingType === "SALE" ? "BÁN" : "THUÊ"}
                    </span>
                  </div>
                ) : (
                  <div style={{ 
                    height: "70px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    background: popupPlaceholder, 
                    color: popupPlaceholderText 
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
                {/* Info */}
                <div style={{ padding: "8px 10px 10px" }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: priceColor, lineHeight: 1.2 }}>
                    {formatPriceFull(item.price)}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", fontWeight: 600, color: popupText, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </p>
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: popupMuted }}>
                    {item.area && item.area > 0 && <span>{item.area}m²</span>}
                    {item.bedrooms && item.bedrooms > 0 && <span>{item.bedrooms} PN</span>}
                    {item.bathrooms && item.bathrooms > 0 && <span>{item.bathrooms} WC</span>}
                  </div>
                  {item.address && (
                    <p style={{ margin: "4px 0 0", fontSize: "10px", color: popupMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.address}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
